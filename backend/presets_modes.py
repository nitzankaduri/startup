from schemas import GameConfig


def build_arena_preset(title: str, mode: str) -> GameConfig:
    is_waves = mode == "survival_waves"
    return GameConfig(
        title=f"{title} (Preset)",
        game_mode=mode,
        rules={"time_limit_sec": 120, "target_kills": 7, "waves_count": 3, "player_hp": 110},
        environment={"sky_color": "#E8C9A3", "fog_color": "#E8C9A3", "ambient_intensity": 0.85, "ground_color": "#27303A"},
        player={"speed": 8.8, "jump_force": 9.8, "color": "#FAFAFA"},
        goal={"position": [0.0, 2.8, -16.0]},
        entities=[
            {"id": "citadel", "type": "platform", "position": [0.0, 1.1, -6.0], "scale": [7.5, 2.2, 6.5], "color": "#3E4C5E"},
            {"id": "ramp-l", "type": "ramp", "position": [-5.2, 0.9, -6.0], "scale": [2.8, 0.5, 5.2], "color": "#475569"},
            {"id": "ramp-r", "type": "ramp", "position": [5.2, 0.9, -6.0], "scale": [2.8, 0.5, 5.2], "color": "#475569"},
            {"id": "bp1", "type": "bouncy_pad", "position": [0.0, 0.25, -1.2], "scale": [2.2, 0.35, 2.2], "color": "#52525B"},
            {"id": "cov1", "type": "platform", "position": [-10.0, 1.0, -3.0], "scale": [2.8, 2.0, 3.2], "color": "#334155"},
            {"id": "cov2", "type": "platform", "position": [10.0, 1.0, -3.0], "scale": [2.8, 2.0, 3.2], "color": "#334155"},
            {"id": "cov3", "type": "platform", "position": [-9.5, 1.2, -13.0], "scale": [3.5, 2.4, 2.6], "color": "#334155"},
            {"id": "cov4", "type": "platform", "position": [9.5, 1.2, -13.0], "scale": [3.5, 2.4, 2.6], "color": "#334155"},
            {"id": "sp1", "type": "speed_pad", "position": [-6.5, 0.08, 4.5], "scale": [2.6, 0.12, 2.6], "color": "#475569", "direction": [0.0, 0.0, -1.0]},
            {"id": "sp2", "type": "speed_pad", "position": [6.5, 0.08, 4.5], "scale": [2.6, 0.12, 2.6], "color": "#475569", "direction": [0.0, 0.0, -1.0]},
            {"id": "rb1", "type": "rotating_beam", "position": [0.0, 2.65, -6.0], "scale": [4.4, 0.3, 0.3], "color": "#7F1D1D", "spin_axis": "y", "spin_speed": 1.2},
            {"id": "h1", "type": "heal_pickup", "position": [0.0, 2.9, -6.0], "scale": [0.7, 0.7, 0.7], "color": "#FAFAFA"},
            {"id": "h2", "type": "heal_pickup", "position": [0.0, 0.9, 8.0], "scale": [0.7, 0.7, 0.7], "color": "#FAFAFA"},
            {"id": "c1", "type": "collectible", "position": [-10.0, 2.7, -3.0], "scale": [0.6, 0.6, 0.6], "color": "#E4E4E7"},
            {"id": "c2", "type": "collectible", "position": [10.0, 2.7, -3.0], "scale": [0.6, 0.6, 0.6], "color": "#E4E4E7"},
            *([] if is_waves else [
                {"id": "e1", "type": "chaser_bot", "position": [-12.0, 0.8, -11.0], "scale": [0.9, 0.9, 0.9], "color": "#7F1D1D"},
                {"id": "e2", "type": "chaser_bot", "position": [12.0, 0.8, -11.0], "scale": [0.9, 0.9, 0.9], "color": "#7F1D1D"},
                {"id": "e3", "type": "chaser_bot", "position": [-13.0, 0.8, 3.0], "scale": [0.9, 0.9, 0.9], "color": "#7F1D1D"},
                {"id": "e4", "type": "chaser_bot", "position": [13.0, 0.8, 3.0], "scale": [0.9, 0.9, 0.9], "color": "#7F1D1D"},
                {"id": "e5", "type": "chaser_bot", "position": [0.0, 0.8, -15.5], "scale": [0.9, 0.9, 0.9], "color": "#7F1D1D"},
                {"id": "t1", "type": "turret_bot", "position": [-9.5, 2.95, -13.0], "scale": [1.1, 1.1, 1.1], "color": "#991B1B"},
                {"id": "t2", "type": "turret_bot", "position": [9.5, 2.95, -13.0], "scale": [1.1, 1.1, 1.1], "color": "#991B1B"},
            ]),
        ],
    )


def build_racer_preset(title: str) -> GameConfig:
    return GameConfig(
        title=f"{title} (Preset)",
        game_mode="time_trial_racer",
        rules={"time_limit_sec": 75, "target_kills": 1, "waves_count": 1, "player_hp": 100},
        environment={"sky_color": "#E8C9A3", "fog_color": "#E8C9A3", "ambient_intensity": 0.85, "ground_color": "#3D261C"},
        player={"speed": 14.5, "jump_force": 8.0, "color": "#FAFAFA"},
        goal={"position": [2.0, 2.5, -116.0]},
        entities=[
            {"id": "t1", "type": "platform", "position": [0.0, -0.5, -13.0], "scale": [11.0, 1.0, 22.0], "color": "#7C3F2C"},
            {"id": "sp1", "type": "speed_pad", "position": [0.0, 0.1, -9.0], "scale": [3.4, 0.12, 3.4], "color": "#D69E7E", "direction": [0.0, 0.0, -1.0]},
            {"id": "c1", "type": "collectible", "position": [0.0, 1.1, -18.0], "scale": [0.7, 0.7, 0.7], "color": "#FFF3E0"},
            {"id": "t2", "type": "platform", "position": [-5.0, 0.0, -32.0], "scale": [12.0, 1.0, 20.0], "color": "#7C3F2C"},
            {"id": "cp1", "type": "checkpoint_gate", "position": [-5.0, 2.3, -29.0], "scale": [9.0, 3.6, 0.6], "color": "#E5B869"},
            {"id": "h1", "type": "hazard", "position": [-1.2, 0.8, -35.0], "scale": [1.8, 0.8, 1.8], "color": "#7F1D1D"},
            {"id": "c2", "type": "collectible", "position": [-6.5, 1.4, -36.0], "scale": [0.7, 0.7, 0.7], "color": "#FFF3E0"},
            {"id": "r1", "type": "ramp", "position": [-5.0, 0.75, -44.5], "scale": [9.0, 0.8, 6.5], "color": "#6B5B3E"},
            {"id": "t3", "type": "platform", "position": [-2.0, 1.3, -61.0], "scale": [12.0, 1.0, 22.0], "color": "#7C3F2C"},
            {"id": "sp2", "type": "speed_pad", "position": [-2.0, 1.9, -58.0], "scale": [3.4, 0.12, 3.4], "color": "#D69E7E", "direction": [0.25, 0.0, -1.0]},
            {"id": "cp2", "type": "checkpoint_gate", "position": [-2.0, 3.6, -65.0], "scale": [9.0, 3.6, 0.6], "color": "#E5B869"},
            {"id": "c3", "type": "collectible", "position": [1.0, 2.7, -69.0], "scale": [0.7, 0.7, 0.7], "color": "#FFF3E0"},
            {"id": "t4", "type": "platform", "position": [6.0, 1.1, -82.0], "scale": [12.0, 1.0, 24.0], "color": "#7C3F2C"},
            {"id": "h2", "type": "hazard", "position": [2.2, 1.9, -81.0], "scale": [1.8, 0.8, 1.8], "color": "#7F1D1D"},
            {"id": "cp3", "type": "checkpoint_gate", "position": [6.0, 3.4, -87.0], "scale": [9.0, 3.6, 0.6], "color": "#E5B869"},
            {"id": "c4", "type": "collectible", "position": [7.5, 2.5, -91.0], "scale": [0.7, 0.7, 0.7], "color": "#FFF3E0"},
            {"id": "t5", "type": "platform", "position": [2.0, 1.6, -106.0], "scale": [12.0, 1.0, 28.0], "color": "#7C3F2C"},
            {"id": "sp3", "type": "speed_pad", "position": [2.0, 2.2, -100.0], "scale": [3.5, 0.12, 3.5], "color": "#D69E7E", "direction": [0.0, 0.0, -1.0]},
            {"id": "cp4", "type": "checkpoint_gate", "position": [2.0, 3.9, -109.0], "scale": [9.0, 3.6, 0.6], "color": "#E5B869"},
            {"id": "c5", "type": "collectible", "position": [2.0, 3.0, -112.0], "scale": [0.7, 0.7, 0.7], "color": "#FFF3E0"},
        ],
    )
