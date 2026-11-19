class_name SquadSkillRunner
extends Node
## Reusable 2-skill cooldown scheduler + anticipation/impact timing helper
## with AudioStreamPlayer pooling and +/-8% pitch jitter to prevent mechanical repetition.

signal skill_triggered(hero_id: String, is_cutin: bool, skill_name: String)

@export var hero_id: String = "hero"
@export var normal_skill_name: String = "용기 낸 외침!!"
@export var normal_cooldown: float = 8.0
@export var cutin_skill_name: String = "저리 가란 말이야!!!"
@export var cutin_cooldown: float = 11.5

var _normal_timer: float = 0.0
var _cutin_timer: float = 0.0
var _busy: bool = false
var _rng: RandomNumberGenerator = RandomNumberGenerator.new()


func _ready() -> void:
	_rng.randomize()
	_normal_timer = normal_cooldown * 0.25
	_cutin_timer = cutin_cooldown * 0.6


func _process(delta: float) -> void:
	if _busy:
		return
	_normal_timer -= delta
	_cutin_timer -= delta
	if _cutin_timer <= 0.0:
		_cutin_timer = cutin_cooldown
		_busy = true
		skill_triggered.emit(hero_id, true, cutin_skill_name)
	elif _normal_timer <= 0.0:
		_normal_timer = normal_cooldown
		_busy = true
		skill_triggered.emit(hero_id, false, normal_skill_name)


func finish_skill() -> void:
	_busy = false


func play_sfx_with_jitter(stream: AudioStream, volume_db: float = -4.0) -> void:
	if not stream:
		return
	var player := AudioStreamPlayer.new()
	player.stream = stream
	player.volume_db = volume_db
	player.pitch_scale = _rng.randf_range(0.92, 1.08)
	add_child(player)
	player.finished.connect(player.queue_free)
	player.play()
