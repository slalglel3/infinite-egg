class_name RoadRenderer
extends Node2D
## 2D Planar-Homography Road Asset Renderer for Infinite Egg.
## Maps perspective-sliced pre-rendered wood plank bridges, turn corner platforms,
## vertical support pillars, and broken-gap cliff wings strictly onto zero-curvature
## projected diagonal tracks.

const RoadPerspective := preload("res://scripts/road_perspective.gd")
const RoadGenerator := preload("res://scripts/road_generator.gd")

const MANIFEST_PATH := "res://assets/roads/road_manifest.json"

@export var road_visual_width_scale: float = 1.24
@export var slices_per_segment: int = 10
@export var show_wireframe: bool = false:
	set(v):
		show_wireframe = v
		queue_redraw()

var camera_pos: Vector2 = Vector2.ZERO

var _manifest: Dictionary = {}
var _textures: Dictionary = {}
var _segments: Array[Dictionary] = []
var _seg_visuals: Dictionary = {}
var _last_bucket_choice: Dictionary = {}
var _frame_meshes: Array[ArrayMesh] = []
var _rng := RandomNumberGenerator.new()


func _ready() -> void:
	_load_manifest_and_textures()


func reset_visuals(seed_val: int = 0) -> void:
	if seed_val != 0:
		_rng.seed = seed_val
	else:
		_rng.randomize()
	_seg_visuals.clear()
	_last_bucket_choice.clear()
	_segments.clear()
	queue_redraw()


func _load_manifest_and_textures() -> void:
	if not _manifest.is_empty():
		return
	if not FileAccess.file_exists(MANIFEST_PATH):
		push_error("Missing road manifest: " + MANIFEST_PATH)
		return
	var txt := FileAccess.get_file_as_string(MANIFEST_PATH)
	var parsed: Variant = JSON.parse_string(txt)
	if typeof(parsed) != TYPE_DICTIONARY:
		push_error("Invalid JSON in road manifest")
		return
	_manifest = parsed

	for dir_key in ["ltr", "rtl"]:
		if not _manifest.has(dir_key):
			continue
		var buckets: Dictionary = _manifest[dir_key]
		for b_key in buckets.keys():
			var items: Array = buckets[b_key]
			for item in items:
				var p: String = item["path"]
				var tex := ResourceLoader.load(p) as Texture2D
				if tex:
					_textures[item["id"]] = tex

	if _manifest.has("corners"):
		var corners: Dictionary = _manifest["corners"]
		for side in corners.keys():
			for item in corners[side]:
				var p: String = item["path"]
				var tex := ResourceLoader.load(p) as Texture2D
				if tex:
					_textures[item["id"]] = tex


func sync_segments(segments: Array[Dictionary]) -> void:
	_load_manifest_and_textures()
	_segments = segments

	# Remove cached visuals for culled segments
	if _seg_visuals.size() > _segments.size() + 32:
		var live_ids: Dictionary = {}
		for s in _segments:
			live_ids[int(s["id"])] = true
		for k in _seg_visuals.keys():
			if not live_ids.has(k):
				_seg_visuals.erase(k)

	for i in range(_segments.size()):
		var seg := _segments[i]
		var sid := int(seg["id"])
		if _seg_visuals.has(sid):
			continue
		_assign_segment_visual(i, sid)

	# Compute seam trims & extensions smoothly across neighbors
	_recompute_segment_joins()
	queue_redraw()


func _pick_variant(dir_key: String, bucket: String, variant_seed: int, exclude_ids: Array[String] = []) -> Dictionary:
	if not _manifest.has(dir_key):
		return {}
	var buckets: Dictionary = _manifest[dir_key]
	if not buckets.has(bucket):
		return {}
	var items: Array = buckets[bucket]
	if items.is_empty():
		return {}

	var filtered: Array = []
	for item in items:
		if not exclude_ids.has(item["id"]):
			filtered.append(item)
	if filtered.is_empty():
		filtered = items

	var bucket_key := dir_key + "_" + bucket
	var last_id: String = _last_bucket_choice.get(bucket_key, "")
	var candidates: Array = []
	for item in filtered:
		if item["id"] != last_id or filtered.size() == 1:
			candidates.append(item)
	if candidates.is_empty():
		candidates = filtered

	var pick_idx := posmod(variant_seed, candidates.size())
	var chosen: Dictionary = candidates[pick_idx]
	_last_bucket_choice[bucket_key] = chosen["id"]
	return chosen


func _assign_segment_visual(idx: int, sid: int) -> void:
	var seg := _segments[idx]
	var seg_type := int(seg["type"])
	var vseed := int(seg.get("variant_seed", sid * 131))

	if seg_type == RoadGenerator.SegType.TURN:
		# old_dir == RIGHT_DOWN (\) -> LEFT_DOWN (/): vertex juts RIGHT (>) -> corner_right
		var old_dir := int(seg["direction"])
		var side := "right" if old_dir == RoadGenerator.Direction.RIGHT_DOWN else "left"
		var corners: Array = _manifest.get("corners", {}).get(side, [])
		var corner_item: Dictionary = {}
		if not corners.is_empty():
			var last_c: String = _last_bucket_choice.get("corner_" + side, "")
			var cands: Array = []
			for c in corners:
				if c["id"] != last_c or corners.size() == 1:
					cands.append(c)
			corner_item = cands[posmod(vseed, cands.size())]
			_last_bucket_choice["corner_" + side] = corner_item["id"]
		_seg_visuals[sid] = {
			"type": seg_type,
			"side": side,
			"corner_asset": corner_item,
		}
		return

	var dir_key := "ltr" if int(seg["direction"]) == RoadGenerator.Direction.RIGHT_DOWN else "rtl"
	if seg_type == RoadGenerator.SegType.GAP:
		var broken_item := _pick_variant(dir_key, "broken", vseed)
		# Fallback filler if runway behind broken wing exceeds broken sprite left wing
		var filler_item := _pick_variant(dir_key, "short", vseed + 17)
		_seg_visuals[sid] = {
			"type": seg_type,
			"dir_key": dir_key,
			"asset": broken_item,
			"filler_asset": filler_item,
			"trim_start": 0.0,
			"trim_end": 0.0,
		}
		return

	# STRAIGHT: match physical segment length cleanly to short / cont / long buckets
	var length := float(seg.get("length", 140.0))
	var bucket := "cont"
	var excludes: Array[String] = []
	if length < 130.0:
		bucket = "short"
	elif length < 192.0:
		bucket = "cont"
	else:
		bucket = "long"

	var road_item := _pick_variant(dir_key, bucket, vseed, excludes)
	_seg_visuals[sid] = {
		"type": seg_type,
		"dir_key": dir_key,
		"asset": road_item,
		"trim_start": 0.0,
		"trim_end": 0.0,
		"ext_start": 0.0,
		"ext_end": 0.0,
	}


func _recompute_segment_joins() -> void:
	var vis_w := RoadPerspective.ROAD_WIDTH * road_visual_width_scale
	var miter_ext := vis_w * 0.14

	for sid in _seg_visuals.keys():
		var v: Dictionary = _seg_visuals[sid]
		if int(v["type"]) == RoadGenerator.SegType.STRAIGHT:
			v["trim_start"] = 0.0
			v["trim_end"] = 0.0
			v["ext_start"] = 0.0
			v["ext_end"] = 0.0

	for i in range(_segments.size()):
		var seg := _segments[i]
		var sid := int(seg["id"])
		var v: Dictionary = _seg_visuals[sid]
		var stype := int(seg["type"])

		if stype == RoadGenerator.SegType.STRAIGHT:
			if i > 0 and int(_segments[i - 1]["type"]) == RoadGenerator.SegType.TURN:
				v["ext_start"] = miter_ext
			if i + 1 < _segments.size() and int(_segments[i + 1]["type"]) == RoadGenerator.SegType.TURN:
				v["ext_end"] = miter_ext

		elif stype == RoadGenerator.SegType.GAP:
			var asset: Dictionary = v.get("asset", {})
			if asset.is_empty():
				continue
			var whw_ortho := float(asset.get("walk_half_w_ortho_px", asset["walk_half_w_px"]))
			var nat_total := clampf((float(asset["length_px"]) / maxf(16.0, 2.0 * whw_ortho)) * vis_w, 220.0, 390.0)
			var g0 := float(asset["gap_t0"])
			var g1 := float(asset["gap_t1"])

			# Left wing extends backward from seg.end
			var left_nat := g0 * nat_total
			var prev_is_straight := (i > 0 and int(_segments[i - 1]["type"]) == RoadGenerator.SegType.STRAIGHT)
			var prev_prev_is_gap := (i >= 2 and int(_segments[i - 2]["type"]) == RoadGenerator.SegType.GAP)
			var max_back := float(seg["length"])
			if i > 0 and int(_segments[i - 1]["type"]) == RoadGenerator.SegType.TURN:
				max_back += miter_ext
			elif prev_is_straight:
				var prev_len := float(_segments[i - 1]["length"])
				max_back += prev_len * (0.42 if prev_prev_is_gap else 0.85)

			var left_span := minf(left_nat, max_back)
			v["left_span"] = left_span
			v["nat_total"] = nat_total

			if prev_is_straight and left_span > float(seg["length"]) + 8.0:
				var pv: Dictionary = _seg_visuals[int(_segments[i - 1]["id"])]
				pv["trim_end"] = minf(float(_segments[i - 1]["length"]) * 0.92, (left_span - float(seg["length"])) - 4.0)

			# Right wing extends forward from seg.gap_end into next segment
			var right_nat := (1.0 - g1) * nat_total
			if i + 1 < _segments.size() and int(_segments[i + 1]["type"]) == RoadGenerator.SegType.STRAIGHT:
				var next_seg := _segments[i + 1]
				var next_len := float(next_seg["length"])
				var next_next_is_turn := (i + 2 < _segments.size() and int(_segments[i + 2]["type"]) == RoadGenerator.SegType.TURN)
				var next_next_is_gap := (i + 2 < _segments.size() and int(_segments[i + 2]["type"]) == RoadGenerator.SegType.GAP)
				var max_fwd := next_len * (0.48 if next_next_is_gap else 1.0)
				if next_next_is_turn:
					max_fwd += miter_ext
				var right_span := minf(right_nat, max_fwd)
				v["right_span"] = right_span
				var nv: Dictionary = _seg_visuals[int(next_seg["id"])]
				nv["trim_start"] = maxf(0.0, right_span - 4.0)
			else:
				v["right_span"] = minf(right_nat, 130.0)


func _draw() -> void:
	_frame_meshes.clear()
	if _segments.is_empty():
		return
	var vp_size := get_viewport_rect().size
	var vis_half_w := RoadPerspective.ROAD_WIDTH * 0.5 * road_visual_width_scale

	# Painter's order pass 1: Timber support columns beneath TURN corners
	for i in range(_segments.size()):
		var seg := _segments[i]
		if int(seg["type"]) == RoadGenerator.SegType.TURN:
			_draw_turn_support_pillar(seg, vp_size, vis_half_w)

	# Painter's order pass 2: Road decks, broken cliffs, and turn corner caps (top/distant -> bottom/near)
	for i in range(_segments.size()):
		var seg := _segments[i]
		var sid := int(seg["id"])
		var v: Dictionary = _seg_visuals.get(sid, {})
		if v.is_empty():
			continue
		var stype := int(seg["type"])

		if stype == RoadGenerator.SegType.STRAIGHT:
			_draw_straight_segment(seg, v, vp_size, vis_half_w)
		elif stype == RoadGenerator.SegType.GAP:
			_draw_gap_segment(seg, v, vp_size, vis_half_w)
		elif stype == RoadGenerator.SegType.TURN:
			_draw_turn_corner_cap(seg, v, vp_size, vis_half_w)

	if show_wireframe:
		_draw_homography_wireframe(vp_size, vis_half_w)


func _depth_tint_at(world_y: float) -> Color:
	var anchor_y := get_viewport_rect().size.y * 0.42
	var ry := (world_y - (camera_pos.y + anchor_y)) * RoadPerspective.ROAD_VERTICAL_RATIO
	if ry < -35.0:
		# Subtle golden atmospheric warmth for distant upper hillside turns
		var haze := clampf((-ry - 35.0) / 280.0, 0.0, 0.30)
		return Color.WHITE.lerp(Color(1.06, 0.90, 0.72, 1.0), haze)
	return Color.WHITE


func _draw_turn_support_pillar(seg: Dictionary, vp_size: Vector2, vis_half_w: float) -> void:
	var pos_w: Vector2 = seg["start"]
	var proj := RoadPerspective.project_point(pos_w.x, pos_w.y, camera_pos, vp_size)
	if float(proj["w"]) <= RoadPerspective.PERSPECTIVE_W_MIN + 0.01:
		return
	var p_scr: Vector2 = proj["screen"]
	if p_scr.y < -120.0 or p_scr.y > vp_size.y + 80.0:
		return

	var s := float(proj["scale"])
	var post_w := maxf(8.0, 15.0 * s)
	var post_h := clampf(190.0 * s, 50.0, 360.0)
	var old_dir := int(seg["direction"])
	# Position vertical support post right beneath the corner inner elbow
	var x_off := (-0.42 if old_dir == RoadGenerator.Direction.RIGHT_DOWN else 0.42) * vis_half_w * s
	var top := Vector2(p_scr.x + x_off, p_scr.y + 4.0 * s)

	var pts := PackedVector2Array([
		Vector2(top.x - post_w * 0.5, top.y),
		Vector2(top.x + post_w * 0.5, top.y),
		Vector2(top.x + post_w * 0.44, top.y + post_h),
		Vector2(top.x - post_w * 0.44, top.y + post_h),
	])
	var c_top := Color(0.28, 0.16, 0.09, 0.88)
	var c_bot := Color(0.28, 0.16, 0.09, 0.0)
	draw_polygon(pts, PackedColorArray([c_top, c_top, c_bot, c_bot]))
	# Thin sunlit wood highlight edge on pillar left side
	draw_line(pts[0], pts[3], Color(0.55, 0.34, 0.17, 0.45), maxf(1.5, 2.5 * s))


func _draw_straight_segment(seg: Dictionary, v: Dictionary, vp_size: Vector2, vis_half_w: float) -> void:
	var asset: Dictionary = v.get("asset", {})
	if asset.is_empty():
		return
	var tex: Texture2D = _textures.get(asset["id"], null)
	if tex == null:
		return

	var dir_sign := 1.0 if int(seg["direction"]) == RoadGenerator.Direction.RIGHT_DOWN else -1.0
	var dir_w := Vector2(dir_sign * RoadPerspective.SLOPE_COS, RoadPerspective.SLOPE_SIN)
	var seg_len := float(seg["length"])
	var trim_s := float(v.get("trim_start", 0.0))
	var trim_e := float(v.get("trim_end", 0.0))
	var ext_s := float(v.get("ext_start", 0.0))
	var ext_e := float(v.get("ext_end", 0.0))

	if trim_s + trim_e >= seg_len - 4.0:
		return

	var start_w: Vector2 = seg["start"] + dir_w * (trim_s - ext_s)
	var end_w: Vector2 = seg["end"] - dir_w * (trim_e - ext_e)

	var mid_y := 0.5 * (start_w.y + end_w.y)
	var tint := _depth_tint_at(mid_y)
	if bool(seg.get("is_cracked", false)):
		tint = tint.lerp(Color(1.08, 0.82, 0.68, 1.0), 0.45)

	var n_slices := 6 if String(seg.get("size_class", "cont")) == "short" else slices_per_segment
	_draw_homography_mesh_strip(tex, asset, start_w, end_w, 0.0, 1.0, dir_sign, vp_size, vis_half_w, tint, n_slices)


func _draw_gap_segment(seg: Dictionary, v: Dictionary, vp_size: Vector2, vis_half_w: float) -> void:
	var asset: Dictionary = v.get("asset", {})
	if asset.is_empty():
		return
	var tex: Texture2D = _textures.get(asset["id"], null)
	if tex == null:
		return

	var dir_sign := 1.0 if int(seg["direction"]) == RoadGenerator.Direction.RIGHT_DOWN else -1.0
	var dir_w := Vector2(dir_sign * RoadPerspective.SLOPE_COS, RoadPerspective.SLOPE_SIN)
	var nat_total := float(v.get("nat_total", 340.0))
	var g0 := float(asset["gap_t0"])
	var g1 := float(asset["gap_t1"])
	var g_mid := 0.5 * (g0 + g1)

	var left_span := float(v.get("left_span", float(seg["length"])))
	var right_span := float(v.get("right_span", 120.0))

	var tint := _depth_tint_at(0.5 * (float(seg["start"].y) + float(seg["gap_end"].y)))

	# If solid takeoff runway starts earlier than left_span covers, draw seamless filler deck leading into broken edge
	var run_len := float(seg["length"])
	if left_span < run_len - 6.0:
		var filler: Dictionary = v.get("filler_asset", {})
		var filler_tex: Texture2D = _textures.get(filler.get("id", ""), null) if not filler.is_empty() else null
		if filler_tex:
			var f_end: Vector2 = seg["end"] - dir_w * (left_span - 8.0)
			_draw_homography_mesh_strip(filler_tex, filler, seg["start"], f_end, 0.0, 1.0, dir_sign, vp_size, vis_half_w, tint, 6)

	# 1. Left snapped cliff wing (with dangling frayed rope overhanging slightly past seg.end)
	var rope_over := clampf((g1 - g0) * 0.42, 0.015, 0.042)
	var t_l0 := maxf(0.0, g0 - left_span / nat_total)
	var t_l1 := minf(g_mid + 0.01, g0 + rope_over)
	var w_l0: Vector2 = seg["end"] - dir_w * left_span
	var w_l1: Vector2 = seg["end"] + dir_w * (rope_over * nat_total)
	_draw_homography_mesh_strip(tex, asset, w_l0, w_l1, t_l0, t_l1, dir_sign, vp_size, vis_half_w, tint, 6)

	# 2. Right snapped landing wing anchored dead-on seg.gap_end
	var lip_over := clampf((g1 - g0) * 0.25, 0.01, 0.025)
	var t_r0 := maxf(g_mid - 0.005, g1 - lip_over)
	var t_r1 := minf(1.0, g1 + right_span / nat_total)
	var w_r0: Vector2 = seg["gap_end"] - dir_w * (lip_over * nat_total)
	var w_r1: Vector2 = seg["gap_end"] + dir_w * right_span
	_draw_homography_mesh_strip(tex, asset, w_r0, w_r1, t_r0, t_r1, dir_sign, vp_size, vis_half_w, tint, 6)


func _draw_turn_corner_cap(seg: Dictionary, v: Dictionary, vp_size: Vector2, vis_half_w: float) -> void:
	var corner_asset: Dictionary = v.get("corner_asset", {})
	if corner_asset.is_empty():
		return
	var tex: Texture2D = _textures.get(corner_asset["id"], null)
	if tex == null:
		return

	var pos_w: Vector2 = seg["start"]
	var proj := RoadPerspective.project_point(pos_w.x, pos_w.y, camera_pos, vp_size)
	if float(proj["w"]) <= RoadPerspective.PERSPECTIVE_W_MIN + 0.02:
		return
	var p_scr: Vector2 = proj["screen"]
	if p_scr.y < -220.0 or p_scr.y > vp_size.y + 240.0:
		return

	# Match corner deck width to projected road width at vertex
	var n_w := Vector2(0.0, 0.0)
	var old_dir := int(seg["direction"])
	var dir_sign := 1.0 if old_dir == RoadGenerator.Direction.RIGHT_DOWN else -1.0
	n_w = Vector2(-dir_sign * RoadPerspective.SLOPE_SIN, RoadPerspective.SLOPE_COS)
	var proj_top := RoadPerspective.project_point(pos_w.x - n_w.x * vis_half_w, pos_w.y - n_w.y * vis_half_w, camera_pos, vp_size)
	var proj_bot := RoadPerspective.project_point(pos_w.x + n_w.x * vis_half_w, pos_w.y + n_w.y * vis_half_w, camera_pos, vp_size)
	var road_scr_w := (Vector2(proj_bot["screen"]) - Vector2(proj_top["screen"])).length()

	var deck_w_px := maxf(100.0, float(corner_asset.get("deck_w_px", 330.0)))
	# Target chamfered platform matches bridge width cleanly while bollard post rests in inner V-elbow
	var scale_f := (road_scr_w * 0.98) / deck_w_px
	var tex_w := float(corner_asset["w"])
	var tex_h := float(corner_asset["h"])
	var piv: Array = corner_asset["pivot_px"]
	var piv_px := Vector2(float(piv[0]), float(piv[1]))

	var top_left := p_scr - piv_px * scale_f
	var rect := Rect2(top_left, Vector2(tex_w * scale_f, tex_h * scale_f))
	var tint := _depth_tint_at(pos_w.y)
	draw_texture_rect(tex, rect, false, tint)


func _draw_homography_mesh_strip(
	tex: Texture2D,
	asset: Dictionary,
	start_w: Vector2,
	end_w: Vector2,
	t_tex0: float,
	t_tex1: float,
	dir_sign: float,
	vp_size: Vector2,
	vis_half_w: float,
	tint: Color,
	slices: int
) -> void:
	var clip := RoadPerspective.clip_and_project_segment(start_w, end_w, camera_pos, vp_size)
	if not bool(clip["visible"]):
		return

	var c_t0 := float(clip["t0"])
	var c_t1 := float(clip["t1"])
	var w0 := start_w.lerp(end_w, c_t0)
	var w1 := start_w.lerp(end_w, c_t1)
	var tt0 := lerpf(t_tex0, t_tex1, c_t0)
	var tt1 := lerpf(t_tex0, t_tex1, c_t1)

	var p0: Vector2 = clip["p0"]
	var p1: Vector2 = clip["p1"]
	var min_y := minf(p0.y, p1.y)
	var max_y := maxf(p0.y, p1.y)
	var max_scale := maxf(float(clip["s0"]), float(clip["s1"]))
	var y_pad := 180.0 * clampf(max_scale, 1.0, 4.0)
	if max_y < -y_pad or min_y > vp_size.y + y_pad:
		return

	var n_w := Vector2(-dir_sign * RoadPerspective.SLOPE_SIN, RoadPerspective.SLOPE_COS)
	var a_px := Vector2(float(asset["a_px"][0]), float(asset["a_px"][1]))
	var b_px := Vector2(float(asset["b_px"][0]), float(asset["b_px"][1]))
	var n_px := Vector2(float(asset["normal_px"][0]), float(asset["normal_px"][1]))
	var tex_size := Vector2(float(asset["w"]), float(asset["h"]))

	var walk_hw_px := maxf(8.0, float(asset["walk_half_w_px"]))
	var pad_top_uv_px := float(asset["pad_top_px"]) * 1.07
	var pad_bot_uv_px := float(asset["pad_bot_px"]) * 1.10
	var top_ratio := pad_top_uv_px / walk_hw_px
	var bot_ratio := pad_bot_uv_px / walk_hw_px

	var count := maxi(2, slices)
	var verts := PackedVector2Array()
	var uvs := PackedVector2Array()
	var cols := PackedColorArray()
	var indices := PackedInt32Array()

	verts.resize((count + 1) * 2)
	uvs.resize((count + 1) * 2)
	cols.resize((count + 1) * 2)
	indices.resize(count * 6)

	for i in range(count + 1):
		var frac := float(i) / float(count)
		var wc := w0.lerp(w1, frac)
		var proj_top := RoadPerspective.project_point(wc.x - n_w.x * vis_half_w, wc.y - n_w.y * vis_half_w, camera_pos, vp_size)
		var proj_bot := RoadPerspective.project_point(wc.x + n_w.x * vis_half_w, wc.y + n_w.y * vis_half_w, camera_pos, vp_size)

		var scr_top: Vector2 = proj_top["screen"]
		var scr_bot: Vector2 = proj_bot["screen"]
		var scr_mid := (scr_top + scr_bot) * 0.5
		var half_scr := (scr_bot - scr_top) * 0.5

		var v_top := scr_mid - half_scr * top_ratio
		var v_bot := scr_mid + half_scr * bot_ratio

		var tt := lerpf(tt0, tt1, frac)
		var c_px := a_px.lerp(b_px, tt)
		var uv_top := ((c_px - n_px * pad_top_uv_px) / tex_size).clamp(Vector2(0.001, 0.001), Vector2(0.999, 0.999))
		var uv_bot := ((c_px + n_px * pad_bot_uv_px) / tex_size).clamp(Vector2(0.001, 0.001), Vector2(0.999, 0.999))

		var vi := i * 2
		verts[vi] = v_top
		verts[vi + 1] = v_bot
		uvs[vi] = uv_top
		uvs[vi + 1] = uv_bot
		cols[vi] = tint
		cols[vi + 1] = tint

		if i < count:
			var ii := i * 6
			indices[ii] = vi
			indices[ii + 1] = vi + 2
			indices[ii + 2] = vi + 1
			indices[ii + 3] = vi + 1
			indices[ii + 4] = vi + 2
			indices[ii + 5] = vi + 3

	var arrays := []
	arrays.resize(Mesh.ARRAY_MAX)
	arrays[Mesh.ARRAY_VERTEX] = verts
	arrays[Mesh.ARRAY_TEX_UV] = uvs
	arrays[Mesh.ARRAY_COLOR] = cols
	arrays[Mesh.ARRAY_INDEX] = indices

	var mesh := ArrayMesh.new()
	mesh.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arrays, [], {}, Mesh.ARRAY_FLAG_USE_2D_VERTICES)
	_frame_meshes.append(mesh)
	draw_mesh(mesh, tex)


func _draw_homography_wireframe(vp_size: Vector2, vis_half_w: float) -> void:
	for seg in _segments:
		var stype := int(seg["type"])
		if stype == RoadGenerator.SegType.TURN:
			var p := RoadPerspective.project_point(seg["start"].x, seg["start"].y, camera_pos, vp_size)
			if float(p["w"]) > RoadPerspective.PERSPECTIVE_W_MIN:
				draw_circle(p["screen"], 6.0 * clampf(float(p["scale"]), 0.4, 2.2), Color(1.0, 0.85, 0.15, 0.9))
			continue

		var dir_sign := 1.0 if int(seg["direction"]) == RoadGenerator.Direction.RIGHT_DOWN else -1.0
		var n_w := Vector2(-dir_sign * RoadPerspective.SLOPE_SIN, RoadPerspective.SLOPE_COS)
		var top_clip := RoadPerspective.clip_and_project_segment(seg["start"] - n_w * vis_half_w, seg["end"] - n_w * vis_half_w, camera_pos, vp_size)
		var bot_clip := RoadPerspective.clip_and_project_segment(seg["start"] + n_w * vis_half_w, seg["end"] + n_w * vis_half_w, camera_pos, vp_size)
		var mid_clip := RoadPerspective.clip_and_project_segment(seg["start"], seg["end"], camera_pos, vp_size)

		if bool(top_clip["visible"]):
			draw_line(top_clip["p0"], top_clip["p1"], Color(0.2, 0.95, 0.95, 0.85), 2.0)
		if bool(bot_clip["visible"]):
			draw_line(bot_clip["p0"], bot_clip["p1"], Color(0.2, 0.95, 0.95, 0.85), 2.0)
		if bool(mid_clip["visible"]):
			draw_line(mid_clip["p0"], mid_clip["p1"], Color(1.0, 0.95, 0.25, 0.65), 1.5)

		if stype == RoadGenerator.SegType.GAP:
			var gap_clip := RoadPerspective.clip_and_project_segment(seg["end"], seg["gap_end"], camera_pos, vp_size)
			if bool(gap_clip["visible"]):
				draw_line(gap_clip["p0"], gap_clip["p1"], Color(1.0, 0.25, 0.45, 0.95), 3.5)
