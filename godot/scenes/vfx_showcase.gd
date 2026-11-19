extends Node2D
## Built-in VFX showcase scene verifying HDR Glow, shared textures,
## shaders, BossDualGauge, and VfxDirector cut-in / hitstop / shockwave pipeline.

@onready var director: VfxDirector = $VfxDirector
@onready var boss_hud: BossDualGauge = $HudLayer/BossDualGauge
@onready var zodiac_sprite: Sprite2D = $Arena/ZodiacAura
@onready var slash_sprite: Sprite2D = $Arena/SlashArc
@onready var pillar_sprite: Sprite2D = $Arena/GoldenPillar
@onready var curse_sprite: Sprite2D = $Arena/CurseAura

var _t: float = 0.0
var _cutin_fired: bool = false
var _cutin_2_fired: bool = false
var _slash_fired: bool = false


func _ready() -> void:
	boss_hud.boss_name = "저무는 카르돈"
	boss_hud.max_hp = 10000.0
	boss_hud.current_hp = 8500.0
	boss_hud.apply_damage(0.0, 40.0)


func _process(delta: float) -> void:
	_t += delta
	zodiac_sprite.rotation += delta * 0.45

	if not _cutin_fired and _t >= 0.2:
		_cutin_fired = true
		director.enqueue_cutin("lancer", "성창의 가호!!", preload("res://shared/textures/glow_radial.png"), Color(0.55, 0.85, 1.0))

	if not _cutin_2_fired and _t >= 0.35:
		_cutin_2_fired = true
		director.enqueue_cutin("rose_queen", "마지막 왈츠!!", preload("res://shared/textures/magic_zodiac.png"), Color(1.0, 0.32, 0.45))

	if not _slash_fired and _t >= 0.72:
		_slash_fired = true
		slash_sprite.visible = true
		slash_sprite.rotation = -0.95
		slash_sprite.modulate.a = 1.0
		var tw := create_tween()
		tw.tween_property(slash_sprite, "rotation", 1.25, 0.36).set_trans(Tween.TRANS_EXPO).set_ease(Tween.EASE_OUT)
		tw.tween_property(slash_sprite, "modulate:a", 0.0, 0.28)
		director.add_trauma(0.55)
		director.spawn_shockwave(Vector2(860, 420), 0.52, 0.05)
		boss_hud.apply_damage(1400.0, 180.0)
