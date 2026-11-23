from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

CARTOON_THEMES = {"sunny_city", "tropical_beach", "candy_sky", "tokyo_festival", "desert_canyon", "wild_west"}
VALID_MODELS = {
    "subway_train", "train_ramp", "jump_ramp", "street_barrier", "high_barrier", "cartoon_car", "police_cruiser", "city_building",
    "gold_coin", "powerup_magnet", "powerup_jetpack", "jetpack", "cartoon_character", "chaser_guard",
    "sports_car", "skyscraper", "tree", "rock", "coin", "drone", "spaceship", "scifi_crate", "robot", "soldier", "fox", "truck",
}
MODEL_BY_KIND = {
    "vehicle": "cartoon_car", "enemy": "chaser_guard", "boss": "robot", "collectible": "gold_coin",
    "jump_ramp": "train_ramp", "checkpoint": "gold_coin", "building": "city_building",
    "obstacle": "subway_train", "powerup": "powerup_jetpack",
}
THEME_PALETTES = {
    "sunny_city": ("#7DD3FC", "#BAE6FD", "#FDE68A", 1.0),
    "tropical_beach": ("#38BDF8", "#BAE6FD", "#FCD34D", 1.05),
    "candy_sky": ("#F9A8D4", "#FCE7F3", "#93C5FD", 1.05),
    "tokyo_festival": ("#60A5FA", "#DBEAFE", "#FDBA74", 1.0),
    "desert_canyon": ("#A5B4FC", "#FED7AA", "#EA580C", 1.05),
    "wild_west": ("#A5B4FC", "#FDBA74", "#C2410C", 1.05),
}

VALID_BEHAVIORS = {"static", "patrol", "chase", "lane_traffic", "boss_ai", "spin", "hover", "moving_train"}
BEHAVIOR_ALIASES = {
    "idle": "static", "none": "static", "stationary": "static", "fixed": "static",
    "drive": "lane_traffic", "driving": "lane_traffic", "traffic": "lane_traffic", "cruise": "lane_traffic", "cruising": "lane_traffic",
    "follow": "chase", "pursuit": "chase", "pursue": "chase", "attack": "chase",
    "rotate": "spin", "spinning": "spin", "float": "hover", "bob": "hover", "train": "moving_train",
}

LightingPreset = Literal["sunset", "night", "city", "dawn"]
CartoonThemeType = Literal["sunny_city", "tropical_beach", "candy_sky", "tokyo_festival", "desert_canyon", "wild_west"]
WorldLayoutType = Literal["city_grid", "three_lane_track", "race_circuit", "open_biome"]
PlayerRigType = Literal["arcade_car", "three_lane_runner", "third_person_action", "flight_combat"]
WeatherType = Literal["clear", "rain", "snow", "embers", "sandstorm", "fireflies"]
WorldEntityKind = Literal[
    "vehicle", "enemy", "collectible", "jump_ramp", "checkpoint", "building", "obstacle", "boss", "powerup"
]
BehaviorType = Literal["static", "patrol", "chase", "lane_traffic", "boss_ai", "spin", "hover", "moving_train"]


class WorldEntity(BaseModel):
    id: str
    kind: WorldEntityKind = "collectible"
    modelId: str = "gold_coin"
    variant: Optional[str] = None
    behavior: BehaviorType = "static"
    position: List[float] = Field(default_factory=lambda: [0.0, 0.0, -10.0], min_length=3, max_length=3)
    rotation: List[float] = Field(default_factory=lambda: [0.0, 0.0, 0.0], min_length=3, max_length=3)
    scale: float = Field(default=1.0, ge=0.25, le=8.0)
    speed: float = Field(default=6.0, ge=0.0, le=60.0)
    hp: int = Field(default=40, ge=1, le=2000)
    points: int = Field(default=25, ge=0, le=1000)
    color: str = "#D96B27"
    patrolRadius: float = Field(default=14.0, ge=1.0, le=80.0)


class WorldRules(BaseModel):
    winCondition: Literal["target_score", "checkpoints", "defeat_boss", "survive_time"] = "target_score"
    targetScore: int = Field(default=500, ge=50, le=50000)
    timeLimit: int = Field(default=90, ge=20, le=600)


class WorldSpawn(BaseModel):
    position: List[float] = Field(default_factory=lambda: [0.0, 1.8, 0.0], min_length=3, max_length=3)
    yaw: float = 0.0


class WorldBlueprintJSON(BaseModel):
    title: str = "Subway Dash World"
    theme: str = "sunny_city"
    signLabel: str = "METRO"
    lightingPreset: LightingPreset = "sunset"
    weather: WeatherType = "clear"
    worldLayout: WorldLayoutType = "three_lane_track"
    playerRig: PlayerRigType = "three_lane_runner"
    playerModelId: str = "cartoon_character"
    archetype: str = "endless_runner"
    themeConfig: Dict[str, Any] = Field(default_factory=dict)
    entitySkins: Dict[str, Any] = Field(default_factory=dict)
    mechanics: Dict[str, Any] = Field(default_factory=dict)
    hudLabels: Dict[str, str] = Field(default_factory=dict)
    mode: str = "endless_runner"
    themeId: str = "subway_trains"
    playerType: str = "runner_kid"
    obstacleType: str = "subway_train"
    enemyType: str = "chaser_guard"
    collectibleType: str = "gold_coin"
    palette: Dict[str, Any] = Field(default_factory=dict)
    objectiveText: str = "Collect 30 Coins"
    winTarget: int = 30
    canShoot: bool = False
    enemiesShoot: bool = False
    speed: float = 12.0
    jumpPower: float = 13.0
    spawnRate: float = 1.0
    powerupsEnabled: List[str] = Field(default_factory=lambda: ["shield", "triple_shot", "magnet", "jetpack_boost"])
    playerParts: List[Dict[str, Any]] = Field(default_factory=list)
    enemyParts: List[Dict[str, Any]] = Field(default_factory=list)
    obstacleParts: List[Dict[str, Any]] = Field(default_factory=list)
    collectibleParts: List[Dict[str, Any]] = Field(default_factory=list)
    bossConfig: Optional[Dict[str, Any]] = None
    worldPalette: Dict[str, Any] = Field(default_factory=dict)
    playerConfig: Dict[str, Any] = Field(default_factory=dict)
    enemyConfig: Dict[str, Any] = Field(default_factory=dict)
    worldProps: Dict[str, Any] = Field(default_factory=dict)
    spawn: WorldSpawn = Field(default_factory=WorldSpawn)
    entities: List[WorldEntity] = Field(default_factory=list)
    rules: WorldRules = Field(default_factory=WorldRules)


class WorldRefineRequest(BaseModel):
    current_world_json: Optional[Dict[str, Any]] = None
    currentSpec: Optional[Dict[str, Any]] = None
    refinement_prompt: Optional[str] = Field(default=None, max_length=2000)
    instruction: Optional[str] = Field(default=None, max_length=2000)
    current_code: Optional[str] = None
    game_id: Optional[str] = None
    game_title: str = "Untitled 3D World"


class WorldRefineResponse(BaseModel):
    world_json: Optional[WorldBlueprintJSON] = None
    code: Optional[str] = None
    title: str = "Untitled 3D World"
    notes: str = ""
