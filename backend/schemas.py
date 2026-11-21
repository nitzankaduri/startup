from typing import List, Literal, Optional
from pydantic import BaseModel, Field
from blueprint_schemas import GameBlueprint
from world_schemas import WorldBlueprintJSON

Vec3 = List[float]
GameMode = Literal["platformer", "arena_shooter", "time_trial_racer", "survival_waves", "arcade_runner"]
CameraMode = Literal["follow", "first_person", "isometric", "orbit", "side_scroller"]
EntityType = Literal[
    "platform", "ramp", "train", "ramp_train", "moving_platform", "hazard", "collectible", "bouncy_pad",
    "rotating_beam", "speed_pad", "crumbling_platform", "key", "locked_gate",
    "patrol_bot", "chaser_bot", "turret_bot", "checkpoint_gate", "heal_pickup", "powerup",
]


class GameRules(BaseModel):
    time_limit_sec: int = Field(default=90, ge=15, le=600)
    target_kills: int = Field(default=8, ge=1, le=100)
    waves_count: int = Field(default=3, ge=1, le=20)
    player_hp: int = Field(default=100, ge=20, le=500)


class EnvironmentConfig(BaseModel):
    sky_color: str = "#E8C9A3"
    fog_color: str = "#E8C9A3"
    ambient_intensity: float = Field(default=0.9, ge=0.1, le=2.0)
    ground_color: str = "#3D261C"


class PlayerConfig(BaseModel):
    speed: float = Field(default=8.5, ge=2.0, le=20.0)
    jump_force: float = Field(default=9.5, ge=3.0, le=25.0)
    color: str = "#FAFAFA"
    rig: Optional[str] = None


class GoalConfig(BaseModel):
    position: Vec3 = Field(default=[0.0, 2.5, -24.0], min_length=3, max_length=3)


class EntityConfig(BaseModel):
    id: str
    type: EntityType
    position: Vec3 = Field(min_length=3, max_length=3)
    scale: Vec3 = Field(min_length=3, max_length=3)
    color: str = "#27272A"
    move_axis: Optional[Literal["x", "y", "z"]] = None
    move_range: Optional[float] = Field(default=None, ge=0.5, le=20.0)
    spin_speed: Optional[float] = Field(default=None, ge=-10.0, le=10.0)
    spin_axis: Optional[Literal["y", "z"]] = None
    direction: Optional[Vec3] = Field(default=None, min_length=3, max_length=3)
    waypoints: Optional[List[Vec3]] = None
    key_id: Optional[str] = None
    powerup_type: Optional[Literal["jetpack", "magnet", "sneakers", "multiplier"]] = None


class ArchitecturePlan(BaseModel):
    camera_mode: str = "follow"
    input_scheme: str = ""
    models: List[str] = Field(default_factory=list)
    rules_summary: str = ""
    win_loss_triggers: str = ""
    hud_meters: List[str] = Field(default_factory=list)


class GameConfig(BaseModel):
    title: str
    game_mode: GameMode = "platformer"
    camera_mode: CameraMode = "follow"
    controls_hint: Optional[str] = None
    architecture_plan: Optional[ArchitecturePlan] = None
    blueprint: Optional[GameBlueprint] = None
    world_json: Optional[WorldBlueprintJSON] = None
    code: Optional[str] = None
    generation_source: str = "ai_live"
    model_id: str = "gemini-3.5-flash"
    generation_error: Optional[str] = None
    rules: GameRules = Field(default_factory=GameRules)
    environment: EnvironmentConfig = Field(default_factory=EnvironmentConfig)
    player: PlayerConfig = Field(default_factory=PlayerConfig)
    goal: GoalConfig = Field(default_factory=GoalConfig)
    entities: List[EntityConfig] = Field(default_factory=list)


class ScoreEntry(BaseModel):
    player_name: str = Field(min_length=1, max_length=24)
    score: int = Field(ge=0)
    time_seconds: float = Field(default=0.0, ge=0.0)
    time_ms: int = Field(default=0, ge=0)
    created_at: str


class ScoreSubmitRequest(BaseModel):
    player_name: str = Field(min_length=1, max_length=24)
    score: int = Field(ge=0)
    time_seconds: Optional[float] = Field(default=None, ge=0.0)
    time_ms: Optional[int] = Field(default=None, ge=0)


class ThumbnailRequest(BaseModel):
    thumbnail: str = Field(min_length=10, max_length=2_000_000)


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=500)


class RemixRequest(BaseModel):
    game_id: str = Field(min_length=1, max_length=64)
    instruction: str = Field(min_length=3, max_length=500)
    generated_code: Optional[str] = None


class FixCodeRequest(BaseModel):
    code: str = Field(min_length=1)
    error: str = Field(min_length=1)
    prompt: str = ""


class FixCodeResponse(BaseModel):
    code: str
    notes: str = ""


class GenerateResponse(BaseModel):
    id: str
    title: str
    game_config: GameConfig
    thumbnail: Optional[str] = None
    plays_count: int = 0
    scores: List[ScoreEntry] = Field(default_factory=list)


class GameRecord(BaseModel):
    id: str
    title: str
    prompt: str
    theme: str
    game_config: GameConfig
    thumbnail: Optional[str] = None
    plays_count: int = 0
    scores: List[ScoreEntry] = Field(default_factory=list)
    created_at: str
