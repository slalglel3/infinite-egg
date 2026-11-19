class_name RoadGenerator
extends RefCounted
## Procedural zigzag road segment generator matching Infinite Egg rules:
## generates varied continuous, short, long, and naturally broken GAP segments
## with non-repeating random visual asset assignment.

const RoadPerspective := preload("res://scripts/road_perspective.gd")

enum Direction { RIGHT_DOWN, LEFT_DOWN }
enum SegType { STRAIGHT, GAP, TURN }

var current_id: int = 0
var current_pos: Vector2 = Vector2.ZERO
var current_direction: int = Direction.RIGHT_DOWN
var _rng := RandomNumberGenerator.new()
var _last_variant_by_bucket: Dictionary = {}


func reset(start_pos: Vector2 = Vector2.ZERO, seed_val: int = 0) -> void:
	if seed_val != 0:
		_rng.seed = seed_val
	else:
		_rng.randomize()
	current_id = 0
	current_pos = start_pos
	current_direction = Direction.RIGHT_DOWN if _rng.randf() < 0.5 else Direction.LEFT_DOWN
	_last_variant_by_bucket.clear()


func generate_initial_map(pattern_count: int = 28) -> Array[Dictionary]:
	var segments: Array[Dictionary] = []
	segments.append(_create_straight_step(2.4, false))
	for i in range(pattern_count):
		generate_dynamic_pattern(segments, float(i * 6))
	return segments


func generate_dynamic_pattern(segments: Array[Dictionary], current_meters: float) -> void:
	var is_mid := current_meters >= 300.0
	var is_hard := current_meters >= 800.0
	var is_extreme := current_meters >= 1500.0

	var roll := _rng.randf()

	# 1. Jump Course with natural broken GAPs (52%)
	if roll < 0.52:
		var jump_count := 1
		var multi_roll := _rng.randf()
		if is_extreme:
			if multi_roll < 0.25:
				jump_count = 3
			elif multi_roll < 0.70:
				jump_count = 2
		elif is_hard and multi_roll < 0.45:
			jump_count = 2
		elif is_mid and multi_roll < 0.30:
			jump_count = 2

		var lead_steps := 0.0
		var gap_run_steps := 1.4
		var j_roll := _rng.randf()
		if is_extreme:
			if j_roll < 0.50:
				lead_steps = 0.0
				gap_run_steps = 1.0
			elif j_roll < 0.85:
				lead_steps = 0.0
				gap_run_steps = 1.5
			else:
				lead_steps = 1.2
				gap_run_steps = 1.3
		elif is_hard:
			if j_roll < 0.40:
				lead_steps = 0.0
				gap_run_steps = 1.0
			elif j_roll < 0.75:
				lead_steps = 0.0
				gap_run_steps = 1.6
			else:
				lead_steps = 1.5
				gap_run_steps = 1.3
		else:
			if j_roll < 0.25:
				lead_steps = 0.0
				gap_run_steps = 1.8
			elif j_roll < 0.65:
				lead_steps = 1.2
				gap_run_steps = 1.3
			else:
				lead_steps = 2.0
				gap_run_steps = 1.5

		if lead_steps > 0.0:
			segments.append(_create_straight_step(lead_steps, false))
		segments.append(_create_gap_step(current_meters, gap_run_steps))

		for _j in range(1, jump_count):
			var mid_connect := 1.6 if is_extreme else (2.0 if is_hard else 2.4)
			segments.append(_create_straight_step(mid_connect, false))
			segments.append(_create_gap_step(current_meters, 1.2))

		var runway_steps := 3.6
		if is_extreme:
			runway_steps = 2.0
		elif is_hard:
			runway_steps = 2.5
		elif is_mid:
			runway_steps = 3.0

		segments.append(_create_straight_step(runway_steps, false))
		segments.append(_create_turn_segment())
		return

	# 2. Long / medium continuous run (30%)
	if roll < 0.82:
		var run_steps := 3.6 if _rng.randf() < 0.5 else 2.6
		if is_hard:
			run_steps = 2.2 if _rng.randf() < 0.5 else 3.1
		var should_crack := current_meters >= 200.0 and _rng.randf() < 0.30
		segments.append(_create_straight_step(run_steps, should_crack))
		segments.append(_create_turn_segment())
		return

	# 3. Rapid short zigzag rhythm section (18%)
	var zigzag_count := 4 if is_hard else 3
	var step_choices: Array[float] = [0.9, 1.15, 1.4, 1.65]
	if not is_hard:
		step_choices = [1.0, 1.3, 1.55, 1.8]
	for _z in range(zigzag_count):
		var steps: float = step_choices[_rng.randi() % step_choices.size()]
		var crack_short := current_meters >= 400.0 and _rng.randf() < 0.20
		segments.append(_create_straight_step(steps, crack_short))
		segments.append(_create_turn_segment())
	segments.append(_create_straight_step(2.2, false))


func pick_non_repeating_index(bucket_key: String, count: int) -> int:
	if count <= 1:
		return 0
	var last_idx: int = _last_variant_by_bucket.get(bucket_key, -1)
	var idx := _rng.randi() % count
	if idx == last_idx:
		idx = (idx + 1 + (_rng.randi() % (count - 1))) % count
	_last_variant_by_bucket[bucket_key] = idx
	return idx


func _create_straight_step(steps: float, is_cracked: bool) -> Dictionary:
	current_id += 1
	var length := steps * RoadPerspective.STEP_LENGTH
	var dir_sign := 1.0 if current_direction == Direction.RIGHT_DOWN else -1.0
	var delta := Vector2(dir_sign * length * RoadPerspective.SLOPE_COS, length * RoadPerspective.SLOPE_SIN)
	var start_pos := current_pos
	var end_pos := start_pos + delta
	current_pos = end_pos

	var size_class := "cont"
	if steps < 1.85:
		size_class = "short"
	elif steps >= 2.65:
		size_class = "long"

	return {
		"id": current_id,
		"type": SegType.STRAIGHT,
		"direction": current_direction,
		"start": start_pos,
		"end": end_pos,
		"length": length,
		"steps": steps,
		"size_class": size_class,
		"is_cracked": is_cracked,
		"variant_seed": _rng.randi(),
	}


func _create_gap_step(current_meters: float, run_steps: float) -> Dictionary:
	current_id += 1
	var dir_sign := 1.0 if current_direction == Direction.RIGHT_DOWN else -1.0
	var run_length := RoadPerspective.STEP_LENGTH * run_steps
	var start_pos := current_pos
	var end_pos := start_pos + Vector2(dir_sign * run_length * RoadPerspective.SLOPE_COS, run_length * RoadPerspective.SLOPE_SIN)

	var base_gap := 92.0
	var extra_gap := minf(48.0, (current_meters / 1500.0) * 48.0)
	var gap_distance := base_gap + extra_gap
	var gap_delta := Vector2(dir_sign * gap_distance * RoadPerspective.SLOPE_COS, gap_distance * RoadPerspective.SLOPE_SIN)

	var gap_end_pos := end_pos + gap_delta
	current_pos = gap_end_pos

	return {
		"id": current_id,
		"type": SegType.GAP,
		"direction": current_direction,
		"start": start_pos,
		"end": end_pos,
		"gap_end": gap_end_pos,
		"length": run_length,
		"steps": run_steps,
		"gap_distance": gap_distance,
		"size_class": "broken",
		"is_cracked": false,
		"variant_seed": _rng.randi(),
	}


func _create_turn_segment() -> Dictionary:
	current_id += 1
	var old_dir := current_direction
	var new_dir := Direction.LEFT_DOWN if old_dir == Direction.RIGHT_DOWN else Direction.RIGHT_DOWN
	var seg := {
		"id": current_id,
		"type": SegType.TURN,
		"direction": old_dir,
		"new_direction": new_dir,
		"start": current_pos,
		"end": current_pos,
		"length": 0.0,
		"variant_seed": _rng.randi(),
	}
	current_direction = new_dir
	return seg
