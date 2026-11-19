extends Node2D
## Draws the rolling cartoon egg character in screen space atop the perspective bridge.


func _process(_delta: float) -> void:
	queue_redraw()


func _draw() -> void:
	var p := get_parent()
	if not p or not p.has_method("get_egg_screen_state"):
		return
	var st: Dictionary = p.get_egg_screen_state()
	var scr: Vector2 = st["screen"]
	var s := clampf(float(st["scale"]), 0.45, 3.0)
	var z := float(st["z"])
	var roll := float(st["roll"])

	var rx := 18.0 * s
	var ry := 22.0 * s

	# Ground contact shadow (shrinks & softens as egg arcs over broken gap)
	var sh_scale := clampf(1.0 - z / 95.0, 0.35, 1.0)
	var sh_center := scr + Vector2(0.0, 3.0 * s)
	draw_set_transform(sh_center, 0.0, Vector2(1.05 * sh_scale, 0.42 * sh_scale))
	draw_circle(Vector2.ZERO, rx * 1.15, Color(0.18, 0.09, 0.04, 0.48 * sh_scale))

	# Egg center lifted slightly above plank surface + jump height z
	var egg_center := scr - Vector2(0.0, (ry * 0.72) + z * s)
	var stretch := 1.0 + clampf(z / 160.0, 0.0, 0.14)
	var squash := 1.0 / sqrt(stretch)

	# Outer dark cartoon outline
	draw_set_transform(egg_center, sin(roll) * 0.18, Vector2(squash * 1.14, stretch * (ry / rx) * 1.12))
	draw_circle(Vector2.ZERO, rx, Color(0.24, 0.13, 0.06, 1.0))

	# Warm shaded cream egg body
	draw_set_transform(egg_center, sin(roll) * 0.18, Vector2(squash, stretch * (ry / rx)))
	draw_circle(Vector2.ZERO, rx, Color(0.95, 0.85, 0.68, 1.0))

	# Upper-left warm highlight crescent
	draw_set_transform(egg_center + Vector2(-rx * 0.22, -ry * 0.24), sin(roll) * 0.18, Vector2(squash * 0.68, stretch * (ry / rx) * 0.68))
	draw_circle(Vector2.ZERO, rx, Color(1.0, 0.97, 0.90, 0.85))

	# Rolling spot/shell freckle indicator so rotational motion reads cleanly
	var spot_a := roll
	var spot_x := cos(spot_a) * rx * 0.45
	var spot_y := sin(spot_a) * ry * 0.35
	draw_set_transform(egg_center + Vector2(spot_x, spot_y), 0.0, Vector2.ONE)
	if sin(spot_a) > -0.35:
		draw_circle(Vector2.ZERO, maxf(2.0, 3.2 * s), Color(0.84, 0.69, 0.48, 0.75))

	# Specular glints
	draw_set_transform(egg_center + Vector2(-rx * 0.34, -ry * 0.40), 0.0, Vector2.ONE)
	draw_circle(Vector2.ZERO, maxf(1.8, 3.4 * s), Color(1.0, 1.0, 1.0, 0.92))
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
