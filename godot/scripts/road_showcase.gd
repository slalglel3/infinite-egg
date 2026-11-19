extends Node2D
## Showcase & verification scene for Infinite Egg's Godot 4 road pipeline.
## Cruises smoothly downhill across randomly generated continuous, short, long,
## corner-turn, and broken-gap wooden bridges rendered via 2D planar homography.

const RoadPerspective := preload("res://scripts/road_perspective.gd")
const RoadGenerator := preload("res://scripts/road_generator.gd")
const RoadRenderer := preload("res://scripts/road_renderer.gd")

@onready var road_renderer: RoadRenderer = $RoadRenderer
@onready var info_label: Label = $HUD/TopBar/HBox/InfoLabel
@onready var seed_btn: Button = $HUD/TopBar/HBox/SeedBtn
@onready var wire_btn: Button = $HUD/TopBar/HBox/WireBtn

var _gen := RoadGenerator.new()
var _segments: Array[Dictionary] = []
var _seed: int = 20261115

var _seg_idx: int = 0
var _seg_dist: float = 0.0
var _in_gap: bool = false
var _gap_dist: float = 0.0

var _egg_world: Vector2 = Vector2.ZERO
var _egg_z: float = 0.0
var _egg_roll: float = 0.0
var _egg_dir: int = RoadGenerator.Direction.RIGHT_DOWN
var _camera_pos: Vector2 = Vector2.ZERO
var _distance_m: float = 0.0
var _auto_cruise: bool = true
var _cruise_speed: float = 290.0

var _dust_motes: Array[Dictionary] = []
var _bg_time: float = 0.0


func _ready() -> void:
	_init_dust_motes()
	for arg in OS.get_cmdline_user_args():
		if arg == "--wireframe":
			road_renderer.show_wireframe = true
	_rebuild_track(_seed)
	if wire_btn:
		wire_btn.pressed.connect(_toggle_wireframe)
	if seed_btn:
		seed_btn.pressed.connect(_randomize_track)


func _init_dust_motes() -> void:
	var rng := RandomNumberGenerator.new()
	rng.seed = 777
	_dust_motes.clear()
	for _i in range(28):
		_dust_motes.append({
			"pos": Vector2(rng.randf_range(0.0, 540.0), rng.randf_range(0.0, 960.0)),
			"r": rng.randf_range(1.5, 4.2),
			"spd": Vector2(rng.randf_range(6.0, 18.0), rng.randf_range(-14.0, -4.0)),
			"alpha": rng.randf_range(0.14, 0.40),
			"phase": rng.randf_range(0.0, TAU),
		})


func _rebuild_track(new_seed: int) -> void:
	_seed = new_seed
	_gen.reset(Vector2.ZERO, _seed)
	_segments = _gen.generate_initial_map(34)

	# Ensure early showcase frames feature a guaranteed mix of zigzag turns & broken gaps right on screen
	# Start cruising from an early segment where ~12 segments fill upper screen background
	_seg_idx = mini(10, _segments.size() - 1)
	while _seg_idx < _segments.size() - 1 and int(_segments[_seg_idx]["type"]) == RoadGenerator.SegType.TURN:
		_seg_idx += 1

	_seg_dist = 0.0
	_in_gap = false
	_gap_dist = 0.0
	_egg_z = 0.0
	_distance_m = 0.0
	var start_seg := _segments[_seg_idx]
	_egg_world = start_seg["start"]
	_egg_dir = int(start_seg["direction"])

	var vp := get_viewport_rect().size
	_camera_pos = Vector2(_egg_world.x - vp.x * 0.5, _egg_world.y - vp.y * 0.42)

	road_renderer.reset_visuals(_seed)
	road_renderer.camera_pos = _camera_pos
	road_renderer.sync_segments(_segments)
	_update_hud()
	queue_redraw()


func _randomize_track() -> void:
	var rng := RandomNumberGenerator.new()
	rng.randomize()
	_rebuild_track(rng.randi())


func _toggle_wireframe() -> void:
	road_renderer.show_wireframe = not road_renderer.show_wireframe
	_update_hud()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		var kc := (event as InputEventKey).keycode
		if kc == KEY_R:
			_randomize_track()
		elif kc == KEY_W:
			_toggle_wireframe()
		elif kc == KEY_SPACE:
			_auto_cruise = not _auto_cruise


func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	_bg_time += dt
	for m in _dust_motes:
		var p: Vector2 = m["pos"] + m["spd"] * dt
		if p.y < -10.0:
			p.y = 970.0
		if p.x > 550.0:
			p.x = -10.0
		m["pos"] = p

	if _auto_cruise and _seg_idx < _segments.size():
		_advance_cruise(dt)

	var vp := get_viewport_rect().size
	var look_x := _egg_world.x
	if _seg_idx + 1 < _segments.size():
		look_x = lerpf(_egg_world.x, float(_segments[_seg_idx + 1]["end"].x), 0.22)
	var target_cam := Vector2(look_x - vp.x * 0.5, _egg_world.y - vp.y * 0.42)
	_camera_pos = _camera_pos.lerp(target_cam, minf(1.0, dt * 8.5))
	road_renderer.camera_pos = _camera_pos
	road_renderer.queue_redraw()
	_update_hud()
	queue_redraw()


func _advance_cruise(dt: float) -> void:
	var step_dist := _cruise_speed * dt
	_distance_m += step_dist / 100.0
	_egg_roll += dt * (7.5 if _egg_dir == RoadGenerator.Direction.RIGHT_DOWN else -7.5)

	while step_dist > 0.0 and _seg_idx < _segments.size():
		var seg := _segments[_seg_idx]
		var stype := int(seg["type"])

		if stype == RoadGenerator.SegType.TURN:
			_seg_idx += 1
			_seg_dist = 0.0
			_in_gap = false
			continue

		_egg_dir = int(seg["direction"])
		var dir_sign := 1.0 if _egg_dir == RoadGenerator.Direction.RIGHT_DOWN else -1.0
		var dir_w := Vector2(dir_sign * RoadPerspective.SLOPE_COS, RoadPerspective.SLOPE_SIN)

		if not _in_gap:
			var seg_len := float(seg["length"])
			var rem := seg_len - _seg_dist
			if step_dist < rem:
				_seg_dist += step_dist
				_egg_world = Vector2(seg["start"]) + dir_w * _seg_dist
				_egg_z = 0.0
				step_dist = 0.0
			else:
				step_dist -= rem
				if stype == RoadGenerator.SegType.GAP:
					_in_gap = true
					_gap_dist = 0.0
				else:
					_seg_idx += 1
					_seg_dist = 0.0
		else:
			var g_len := float(seg["gap_distance"])
			var rem_g := g_len - _gap_dist
			if step_dist < rem_g:
				_gap_dist += step_dist
				var frac := _gap_dist / maxf(1.0, g_len)
				_egg_world = Vector2(seg["end"]) + dir_w * _gap_dist
				# Crisp parabolic hop clear over broken chasm
				_egg_z = 4.0 * 44.0 * frac * (1.0 - frac)
				step_dist = 0.0
			else:
				step_dist -= rem_g
				_in_gap = false
				_gap_dist = 0.0
				_egg_z = 0.0
				_seg_idx += 1
				_seg_dist = 0.0

	# Expand infinite road ahead and prune distant segments behind
	var appended := false
	while _segments.size() - _seg_idx < 36:
		_gen.generate_dynamic_pattern(_segments, _distance_m + 300.0)
		appended = true

	while _seg_idx > 26 and _segments[0]["end"].y < _camera_pos.y - 3600.0:
		_segments.pop_front()
		_seg_idx -= 1
		appended = true

	if appended:
		road_renderer.sync_segments(_segments)


func _update_hud() -> void:
	if info_label == null:
		return
	var seg_tag := "STRAIGHT"
	if _seg_idx < _segments.size():
		var seg := _segments[_seg_idx]
		var st := int(seg["type"])
		if _in_gap:
			seg_tag = "JUMP GAP"
		elif st == RoadGenerator.SegType.GAP:
			seg_tag = "BROKEN BRIDGE"
		else:
			seg_tag = String(seg.get("size_class", "cont")).to_upper()
	info_label.text = "%.0fm | %s" % [_distance_m, seg_tag]
	if wire_btn:
		wire_btn.text = "WIRE: ON" if road_renderer.show_wireframe else "WIRE [W]"


func _draw() -> void:
	var vp := get_viewport_rect().size
	_draw_barn_backdrop(vp)


func _draw_barn_backdrop(vp: Vector2) -> void:
	# Warm golden-brown sunlit barn interior gradient matching play.png color temperature
	var bands := PackedVector2Array([
		Vector2(0, 0), Vector2(vp.x, 0),
		Vector2(vp.x, vp.y * 0.42), Vector2(0, vp.y * 0.42),
	])
	var c_top := Color(0.29, 0.17, 0.09, 1.0)
	var c_mid := Color(0.60, 0.36, 0.17, 1.0)
	draw_polygon(bands, PackedColorArray([c_top, c_top, c_mid, c_mid]))

	var lower := PackedVector2Array([
		Vector2(0, vp.y * 0.42), Vector2(vp.x, vp.y * 0.42),
		Vector2(vp.x, vp.y), Vector2(0, vp.y),
	])
	var c_bot := Color(0.86, 0.62, 0.30, 1.0)
	draw_polygon(lower, PackedColorArray([c_mid, c_mid, c_bot, c_bot]))

	# Subtle distant wooden barn vertical framing silhouettes on far left/right
	draw_rect(Rect2(0.0, 0.0, 26.0, vp.y), Color(0.18, 0.09, 0.04, 0.35))
	draw_rect(Rect2(vp.x - 26.0, 0.0, 26.0, vp.y), Color(0.18, 0.09, 0.04, 0.35))

	# Diagonal warm morning sunbeams streaming across upper barn
	for i in range(4):
		var shift := sin(_bg_time * 0.55 + float(i) * 1.4) * 10.0
		var x0 := 70.0 + float(i) * 115.0 + shift
		var beam := PackedVector2Array([
			Vector2(x0, 0.0),
			Vector2(x0 + 58.0, 0.0),
			Vector2(x0 + 230.0, vp.y * 0.85),
			Vector2(x0 + 130.0, vp.y * 0.85),
		])
		draw_polygon(beam, PackedColorArray([
			Color(1.0, 0.90, 0.62, 0.09),
			Color(1.0, 0.90, 0.62, 0.09),
			Color(1.0, 0.86, 0.52, 0.0),
			Color(1.0, 0.86, 0.52, 0.0),
		]))

	# Floating golden dust motes
	for m in _dust_motes:
		var pulse := 0.7 + 0.3 * sin(_bg_time * 2.2 + float(m["phase"]))
		draw_circle(m["pos"], float(m["r"]), Color(1.0, 0.93, 0.72, float(m["alpha"]) * pulse))


func get_egg_screen_state() -> Dictionary:
	var vp := get_viewport_rect().size
	var proj := RoadPerspective.project_point(_egg_world.x, _egg_world.y, _camera_pos, vp)
	return {
		"screen": proj["screen"],
		"scale": proj["scale"],
		"z": _egg_z,
		"roll": _egg_roll,
		"dir": _egg_dir,
	}
