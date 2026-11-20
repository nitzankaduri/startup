from typing import List, Literal, Optional
from pydantic import BaseModel, Field

CameraRigType = Literal[
    "third_person_orbit",
    "first_person",
    "isometric_tactical",
    "top_down_arcade",
    "chase_vehicle",
    "cockpit_flight",
]

BiomeThemeType = Literal[
    "sunset_canyon",
    "alpine_meadow",
    "cyber_dusk",
    "tropical_archipelago",
    "lunar_crater",
    "obsidian_fortress",
]

ControllerPresetType = Literal[
    "third_person_action",
    "arcade_vehicle",
    "flight_shooter",
    "tactical_isometric",
]

WeatherType = Literal["clear", "rain", "snow", "embers", "sandstorm", "fireflies"]
TimeOfDayType = Literal["dawn", "noon", "golden_hour", "midnight"]


class GenreAndCameraSpec(BaseModel):
    camera_rig: CameraRigType = "third_person_orbit"
    player_controller_preset: ControllerPresetType = "third_person_action"
    game_mode: str = "platformer"
    control_scheme: str = "WASD move, Space jump, Shift dash, Mouse click action"
    camera_distance: float = 8.2
    camera_height: float = 4.2


class CoreMechanicSpec(BaseModel):
    name: str
    trigger_input: str
    physics_or_state_rule: str
    player_feedback: str


class VisualArtDirectionSpec(BaseModel):
    biome_stage_theme: BiomeThemeType = "sunset_canyon"
    time_of_day: TimeOfDayType = "golden_hour"
    weather: WeatherType = "clear"
    sky_atmosphere_mood: str = "Crisp sunlit warm horizon"
    sky_horizon_hex: str = "#FCE5CE"
    sky_top_hex: str = "#6BC4FF"
    lighting_angle: str = "Golden hour diagonal key light with cool sky fill"
    ground_topology: str = "Sculpted terrain or detailed architectural arena"
    studio_entities: List[str] = Field(default_factory=lambda: ["tower", "pine_tree", "boulder"])
    landmarks: List[str] = Field(default_factory=list)
    hero_assembly_recipe: str = ""
    enemy_or_prop_recipes: List[str] = Field(default_factory=list)


class RulesAndProgressionSpec(BaseModel):
    win_condition: str = "Complete primary objective and reach extraction beacon"
    lose_condition: str = "Player HP reaches 0"
    escalating_stages: List[str] = Field(default_factory=list)
    risk_reward_loop: str = ""
    custom_hud_keys: List[str] = Field(default_factory=list)


class GameBlueprint(BaseModel):
    title: str = "Untitled 3D World"
    genre_and_camera: GenreAndCameraSpec = Field(default_factory=GenreAndCameraSpec)
    unique_core_mechanics: List[CoreMechanicSpec] = Field(default_factory=list)
    visual_art_direction: VisualArtDirectionSpec = Field(default_factory=VisualArtDirectionSpec)
    rules_and_progression: RulesAndProgressionSpec = Field(default_factory=RulesAndProgressionSpec)


class RefineRequest(BaseModel):
    current_code: str = Field(min_length=1)
    refinement_prompt: str = Field(min_length=1, max_length=2000)
    game_title: str = "Untitled 3D World"
    game_id: Optional[str] = None


class RefineResponse(BaseModel):
    code: str
    title: str
    notes: str = ""
    validation_passed: bool = True
    validation_warnings: List[str] = Field(default_factory=list)
