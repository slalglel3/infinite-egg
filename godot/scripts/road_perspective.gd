class_name RoadPerspective
extends RefCounted
## 2D Planar Homography perspective projection matching Infinite Egg's exact
## zero-curvature diagonal track geometry.

const SLOPE_COS: float = 0.8
const SLOPE_SIN: float = 0.6
const STEP_LENGTH: float = 70.0
const ROAD_WIDTH: float = 38.0
const ROAD_VERTICAL_RATIO: float = 4.0 / 9.0
const PERSPECTIVE_K: float = 1.8
const PERSPECTIVE_W_MIN: float = 0.2


static func project_point(
	wx: float,
	wy: float,
	camera_pos: Vector2,
	vp_size: Vector2
) -> Dictionary:
	var anchor := Vector2(vp_size.x * 0.5, vp_size.y * 0.42)
	var rx := wx - (camera_pos.x + anchor.x)
	var ry := (wy - (camera_pos.y + anchor.y)) * ROAD_VERTICAL_RATIO
	var k := PERSPECTIVE_K / maxf(400.0, vp_size.y)
	var w := maxf(PERSPECTIVE_W_MIN, 1.0 - k * ry)
	var scale := 1.0 / w
	return {
		"screen": Vector2(anchor.x + rx * scale, anchor.y + ry * scale),
		"scale": scale,
		"w": w,
	}


static func clip_and_project_segment(
	start_w: Vector2,
	end_w: Vector2,
	camera_pos: Vector2,
	vp_size: Vector2
) -> Dictionary:
	var anchor := Vector2(vp_size.x * 0.5, vp_size.y * 0.42)
	var k := PERSPECTIVE_K / maxf(400.0, vp_size.y)
	var w_min := PERSPECTIVE_W_MIN

	var rx0 := start_w.x - (camera_pos.x + anchor.x)
	var ry0 := (start_w.y - (camera_pos.y + anchor.y)) * ROAD_VERTICAL_RATIO
	var w0 := 1.0 - k * ry0

	var rx1 := end_w.x - (camera_pos.x + anchor.x)
	var ry1 := (end_w.y - (camera_pos.y + anchor.y)) * ROAD_VERTICAL_RATIO
	var w1 := 1.0 - k * ry1

	if w0 < w_min and w1 < w_min:
		return {"visible": false}

	var t0 := 0.0
	var t1 := 1.0

	if w0 < w_min:
		var frac := (w_min - w0) / (w1 - w0)
		t0 = frac
		rx0 += (rx1 - rx0) * frac
		ry0 += (ry1 - ry0) * frac
		w0 = w_min
	elif w1 < w_min:
		var frac := (w_min - w0) / (w1 - w0)
		t1 = frac
		rx1 = rx0 + (rx1 - rx0) * frac
		ry1 = ry0 + (ry1 - ry0) * frac
		w1 = w_min

	var s0 := 1.0 / w0
	var s1 := 1.0 / w1
	return {
		"visible": true,
		"p0": Vector2(anchor.x + rx0 * s0, anchor.y + ry0 * s0),
		"p1": Vector2(anchor.x + rx1 * s1, anchor.y + ry1 * s1),
		"s0": s0,
		"s1": s1,
		"t0": t0,
		"t1": t1,
	}
