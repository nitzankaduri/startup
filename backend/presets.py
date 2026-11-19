import hashlib
from presets_modes import build_arena_preset, build_racer_preset
from schemas import GameConfig


def _detect_mode(prompt: str) -> str:
    low = prompt.lower()
    if any(w in low for w in ("runner", "subway", "chase", "dodge", "lane", "endless", "train", "sliding", "near-miss", "combo", "surf", "ski", "snowboard", "rooftop")):
        return "arcade_runner"
    if any(w in low for w in ("rally", "race", "buggy", "drift", "car", "circuit", "track")):
        return "time_trial_racer"
    if any(w in low for w in ("wave", "survive", "survival", "outpost", "horde", "defend", "marine")):
        return "survival_waves"
    if any(w in low for w in ("arena", "shoot", "shooter", "blaster", "combat", "duel", "gun", "guardian")):
        return "arena_shooter"
    return "platformer"


def _pick_biome(prompt: str):
    low = prompt.lower()
    if any(w in low for w in ("obsidian", "night", "midnight", "space", "twilight")):
        return {"sky": "#23293A", "ground": "#181C26", "plat": "#2B3242", "accent": "#64748B"}
    if any(w in low for w in ("alpine", "snow", "pine", "ice", "mountain", "coastal", "mist")):
        return {"sky": "#E8C9A3", "ground": "#243830", "plat": "#385247", "accent": "#4C6658"}
    if any(w in low for w in ("desert", "canyon", "terracotta", "train", "rally", "sand")):
        return {"sky": "#E8C9A3", "ground": "#3D261C", "plat": "#7C3F2C", "accent": "#D69E7E"}
    return {"sky": "#E8C9A3", "ground": "#473B2A", "plat": "#7A6747", "accent": "#6B5B3E"}


def build_fallback_game(prompt: str) -> GameConfig:
    """Deterministic, prompt-aware 3D world synthesizer when GEMINI_API_KEY is unset."""
    words = [w.strip(".,!?") for w in prompt.strip().split() if len(w.strip(".,!?")) > 2]
    short_title = " ".join(words[:4]).title() or "Sunlit World"
    mode = _detect_mode(prompt)
    biome = _pick_biome(prompt)

    if mode in ("arena_shooter", "survival_waves"):
        cfg = build_arena_preset(short_title, mode)
    elif mode in ("time_trial_racer", "arcade_runner"):
        cfg = build_racer_preset(short_title)
        cfg.game_mode = mode
    else:
        shift = (int(hashlib.md5(prompt.encode()).hexdigest()[:2], 16) % 3) - 1
        cfg = GameConfig(
            title=short_title,
            game_mode="platformer",
            environment={"sky_color": biome["sky"], "fog_color": biome["sky"], "ambient_intensity": 0.9, "ground_color": biome["ground"]},
            player={"speed": 8.4, "jump_force": 9.8, "color": "#FAFAFA"},
            goal={"position": [0.0, 6.7, -46.0]},
            entities=[
                {"id": "p1", "type": "platform", "position": [0.0, 0.2, -6.5], "scale": [5.0, 0.6, 5.0], "color": biome["plat"]},
                {"id": "sp1", "type": "speed_pad", "position": [0.0, 0.58, -6.5], "scale": [2.4, 0.12, 2.4], "color": biome["accent"], "direction": [-0.35, 0.0, -1.0]},
                {"id": "cr1", "type": "crumbling_platform", "position": [-2.8 + shift, 0.8, -12.5], "scale": [3.8, 0.5, 3.8], "color": biome["accent"]},
                {"id": "c1", "type": "collectible", "position": [-2.8 + shift, 2.0, -12.5], "scale": [0.6, 0.6, 0.6], "color": "#E5B869"},
                {"id": "mp1", "type": "moving_platform", "position": [0.0, 1.5, -18.0], "scale": [3.8, 0.5, 3.8], "color": biome["plat"], "move_axis": "x", "move_range": 3.0},
                {"id": "c2", "type": "collectible", "position": [0.0, 2.7, -18.0], "scale": [0.6, 0.6, 0.6], "color": "#E5B869"},
                {"id": "p2", "type": "platform", "position": [3.2, 2.0, -24.0], "scale": [6.0, 0.6, 6.0], "color": biome["plat"]},
                {"id": "rb1", "type": "rotating_beam", "position": [3.2, 2.85, -24.0], "scale": [4.6, 0.32, 0.32], "color": "#7F1D1D", "spin_axis": "y", "spin_speed": 1.3},
                {"id": "k1", "type": "key", "position": [5.2, 3.1, -24.0], "scale": [0.7, 0.7, 0.7], "color": "#E5B869", "key_id": "gate-1"},
                {"id": "r1", "type": "ramp", "position": [3.2, 2.8, -29.5], "scale": [3.6, 0.5, 4.4], "color": biome["accent"]},
                {"id": "c3", "type": "collectible", "position": [3.2, 4.3, -29.5], "scale": [0.6, 0.6, 0.6], "color": "#E5B869"},
                {"id": "p3", "type": "platform", "position": [0.0, 3.5, -35.0], "scale": [5.2, 0.6, 5.0], "color": biome["plat"]},
                {"id": "bp1", "type": "bouncy_pad", "position": [0.0, 3.9, -35.5], "scale": [2.2, 0.35, 2.2], "color": "#52525B"},
                {"id": "c4", "type": "collectible", "position": [0.0, 6.8, -38.5], "scale": [0.6, 0.6, 0.6], "color": "#E5B869"},
                {"id": "p4", "type": "platform", "position": [0.0, 6.2, -43.5], "scale": [7.0, 0.6, 9.0], "color": biome["plat"]},
                {"id": "pb1", "type": "patrol_bot", "position": [0.0, 7.05, -41.5], "scale": [0.8, 0.8, 0.8], "color": "#7F1D1D", "waypoints": [[-2.4, 7.05, -41.5], [2.4, 7.05, -41.5]]},
                {"id": "lg1", "type": "locked_gate", "position": [0.0, 7.7, -44.2], "scale": [5.5, 2.4, 0.5], "color": "#3F3A34", "key_id": "gate-1"},
            ],
        )

    cfg.title = short_title
    cfg.environment.sky_color = biome["sky"]
    cfg.environment.fog_color = biome["sky"]
    cfg.environment.ground_color = biome["ground"]
    return cfg
