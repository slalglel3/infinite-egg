class_name BossDualGauge
extends Control
## Dual-gauge boss HUD inspired by commercial side-scroll squad RPGs:
## Top orange HP bar with trailing damage ghost + bottom thin stagger/shield gauge.

signal boss_staggered

@export var boss_name: String = "저무는 카르돈"
@export var max_hp: float = 10000.0
@export var max_stagger: float = 1000.0

var current_hp: float = 10000.0
var _ghost_hp: float = 10000.0
var current_stagger: float = 1000.0

var _name_label: Label
var _hp_fill: ColorRect
var _hp_ghost: ColorRect
var _stagger_fill: ColorRect
var _bar_width: float = 520.0


func _ready() -> void:
	custom_minimum_size = Vector2(_bar_width + 64.0, 64.0)
	_build_ui()
	_sync_bars()


func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.06, 0.06, 0.08, 0.78)
	bg.position = Vector2(32.0, 10.0)
	bg.size = Vector2(_bar_width + 8.0, 26.0)
	add_child(bg)

	_hp_ghost = ColorRect.new()
	_hp_ghost.color = Color(1.0, 0.92, 0.72, 0.9)
	_hp_ghost.position = Vector2(36.0, 13.0)
	_hp_ghost.size = Vector2(_bar_width, 20.0)
	add_child(_hp_ghost)

	_hp_fill = ColorRect.new()
	_hp_fill.color = Color(0.95, 0.48, 0.08, 1.0)
	_hp_fill.position = Vector2(36.0, 13.0)
	_hp_fill.size = Vector2(_bar_width, 20.0)
	add_child(_hp_fill)

	var stagger_bg := ColorRect.new()
	stagger_bg.color = Color(0.05, 0.05, 0.07, 0.85)
	stagger_bg.position = Vector2(36.0, 38.0)
	stagger_bg.size = Vector2(_bar_width, 8.0)
	add_child(stagger_bg)

	_stagger_fill = ColorRect.new()
	_stagger_fill.color = Color(0.94, 0.96, 1.0, 1.0)
	_stagger_fill.position = Vector2(36.0, 39.0)
	_stagger_fill.size = Vector2(_bar_width, 6.0)
	add_child(_stagger_fill)

	_name_label = Label.new()
	_name_label.text = boss_name
	_name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_name_label.position = Vector2(36.0, 47.0)
	_name_label.size = Vector2(_bar_width, 20.0)
	_name_label.add_theme_font_size_override("font_size", 14)
	_name_label.add_theme_color_override("font_outline_color", Color.BLACK)
	_name_label.add_theme_constant_override("outline_size", 3)
	add_child(_name_label)


func _process(delta: float) -> void:
	if _ghost_hp > current_hp:
		_ghost_hp = maxf(current_hp, _ghost_hp - max_hp * 0.18 * delta)
		if _hp_ghost:
			_hp_ghost.size.x = _bar_width * clampf(_ghost_hp / maxf(max_hp, 1.0), 0.0, 1.0)


func apply_damage(hp_dmg: float, stagger_dmg: float = 0.0) -> void:
	current_hp = clampf(current_hp - hp_dmg, 0.0, max_hp)
	if stagger_dmg > 0.0 and current_stagger > 0.0:
		current_stagger = maxf(0.0, current_stagger - stagger_dmg)
		if current_stagger <= 0.0:
			boss_staggered.emit()
	_sync_bars()


func _sync_bars() -> void:
	if _hp_fill:
		_hp_fill.size.x = _bar_width * clampf(current_hp / maxf(max_hp, 1.0), 0.0, 1.0)
	if _hp_ghost and _ghost_hp <= current_hp:
		_ghost_hp = current_hp
		_hp_ghost.size.x = _hp_fill.size.x
	if _stagger_fill:
		_stagger_fill.size.x = _bar_width * clampf(current_stagger / maxf(max_stagger, 1.0), 0.0, 1.0)
	if _name_label:
		_name_label.text = boss_name
