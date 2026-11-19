class_name VfxDirector
extends Node
## Central VFX orchestration: hitstop, damped Camera2D trauma shake,
## screen-space shockwave distortion, and overlap-safe skill cut-in banners.

signal cutin_started(hero_id: String, skill_name: String)

@export var camera: Camera2D
@export var shockwave_layer: CanvasLayer
@export var cutin_layer: CanvasLayer
@export var shockwave_shader: Shader = preload("res://shared/shaders/vfx_shockwave.gdshader")
@export var cutin_shader: Shader = preload("res://shared/shaders/ui_cutin_banner.gdshader")

var _trauma: float = 0.0
var _base_camera_offset: Vector2 = Vector2.ZERO
var _hitstop_active: bool = false
var _rng: RandomNumberGenerator = RandomNumberGenerator.new()

# Cut-in anti-overlap state (alternating Left / Right slots, queue overflow)
var _slot_busy: Array[bool] = [false, false]
var _cutin_queue: Array[Dictionary] = []


func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_rng.randomize()
	if camera:
		_base_camera_offset = camera.offset


func _process(delta: float) -> void:
	if camera and _trauma > 0.0:
		_trauma = maxf(0.0, _trauma - delta * 2.2)
		var shake := _trauma * _trauma
		camera.offset = _base_camera_offset + Vector2(
			_rng.randf_range(-1.0, 1.0) * 18.0 * shake,
			_rng.randf_range(-1.0, 1.0) * 12.0 * shake
		)
	elif camera and camera.offset != _base_camera_offset:
		camera.offset = _base_camera_offset


func add_trauma(amount: float) -> void:
	_trauma = clampf(_trauma + amount, 0.0, 1.0)


func trigger_hitstop(duration_sec: float = 0.055, slow_scale: float = 0.08) -> void:
	if _hitstop_active or duration_sec <= 0.0:
		return
	_hitstop_active = true
	Engine.time_scale = clampf(slow_scale, 0.01, 1.0)
	await get_tree().create_timer(duration_sec, true, false, true).timeout
	Engine.time_scale = 1.0
	_hitstop_active = false


func spawn_shockwave(world_pos: Vector2, duration_sec: float = 0.42, force: float = 0.045) -> void:
	var target_layer: CanvasLayer = shockwave_layer if shockwave_layer else cutin_layer
	if not target_layer or not shockwave_shader:
		return
	var rect := ColorRect.new()
	rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	rect.set_anchors_preset(Control.PRESET_FULL_RECT)
	var mat := ShaderMaterial.new()
	mat.shader = shockwave_shader

	var vp_size := get_viewport().get_visible_rect().size
	var canvas_xform := get_viewport().get_canvas_transform()
	var screen_pos := canvas_xform * world_pos
	var uv := Vector2(
		clampf(screen_pos.x / maxf(vp_size.x, 1.0), 0.0, 1.0),
		clampf(screen_pos.y / maxf(vp_size.y, 1.0), 0.0, 1.0)
	)
	mat.set_shader_parameter("center_uv", uv)
	mat.set_shader_parameter("progress", 0.0)
	mat.set_shader_parameter("force", force)
	mat.set_shader_parameter("aspect_ratio", vp_size.x / maxf(vp_size.y, 1.0))
	rect.material = mat
	target_layer.add_child(rect)

	var tw := create_tween()
	tw.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tw.tween_method(
		func(v: float) -> void:
			if is_instance_valid(mat):
				mat.set_shader_parameter("progress", v),
		0.0, 1.0, duration_sec
	).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.tween_callback(rect.queue_free)


func enqueue_cutin(hero_id: String, skill_name: String, portrait: Texture2D, accent_color: Color = Color(0.95, 0.9, 1.0)) -> void:
	_cutin_queue.append({
		"hero_id": hero_id,
		"skill_name": skill_name,
		"portrait": portrait,
		"accent": accent_color
	})
	_pump_cutin_queue()


func _pump_cutin_queue() -> void:
	if _cutin_queue.is_empty():
		return
	for slot_idx in 2:
		if not _slot_busy[slot_idx] and not _cutin_queue.is_empty():
			var item: Dictionary = _cutin_queue.pop_front()
			_show_cutin_in_slot(slot_idx, item)


func _show_cutin_in_slot(slot_idx: int, item: Dictionary) -> void:
	if not cutin_layer:
		return
	_slot_busy[slot_idx] = true
	cutin_started.emit(item["hero_id"], item["skill_name"])

	var vp_w := get_viewport().get_visible_rect().size.x
	var panel := Control.new()
	panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	panel.size = Vector2(360.0, 96.0)
	var base_x := 48.0 if slot_idx == 0 else (vp_w - 408.0)
	var target_y := 86.0 if slot_idx == 0 else 192.0
	var slide_from := base_x - 160.0 if slot_idx == 0 else base_x + 160.0
	panel.position = Vector2(slide_from, target_y)

	var bg := ColorRect.new()
	bg.set_anchors_preset(Control.PRESET_FULL_RECT)
	bg.color = Color(item["accent"].r * 0.25, item["accent"].g * 0.25, item["accent"].b * 0.35, 0.85)
	if cutin_shader:
		var mat := ShaderMaterial.new()
		mat.shader = cutin_shader
		mat.set_shader_parameter("rim_tint", item["accent"])
		bg.material = mat
	panel.add_child(bg)

	if item["portrait"]:
		var tex_rect := TextureRect.new()
		tex_rect.texture = item["portrait"]
		tex_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tex_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		tex_rect.set_anchors_preset(Control.PRESET_FULL_RECT)
		if bg.material:
			tex_rect.material = bg.material
		panel.add_child(tex_rect)

	var label := Label.new()
	label.text = item["skill_name"]
	label.position = Vector2(18.0, 60.0)
	label.add_theme_font_size_override("font_size", 20)
	label.add_theme_color_override("font_color", Color.WHITE)
	label.add_theme_color_override("font_outline_color", Color.BLACK)
	label.add_theme_constant_override("outline_size", 4)
	panel.add_child(label)

	cutin_layer.add_child(panel)

	var tw := create_tween()
	tw.set_pause_mode(Tween.TWEEN_PAUSE_PROCESS)
	tw.tween_property(panel, "position:x", base_x, 0.16).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_OUT)
	tw.tween_interval(0.75)
	tw.tween_property(panel, "modulate:a", 0.0, 0.18)
	tw.tween_callback(func() -> void:
		if is_instance_valid(panel):
			panel.queue_free()
		_slot_busy[slot_idx] = false
		_pump_cutin_queue()
	)
