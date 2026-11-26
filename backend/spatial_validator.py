import math
from typing import Any, Dict, List, Tuple
from schemas import EnvironmentConfig, GameConfig, GameRules, GoalConfig, PlayerConfig
from world_schemas import BEHAVIOR_ALIASES, CARTOON_THEMES, MODEL_BY_KIND, THEME_PALETTES, VALID_BEHAVIORS, VALID_MODELS

ROAD_LINES, BLOCK_CENTERS, LANES = (-100.0, -50.0, 0.0, 50.0, 100.0), (-75.0, -25.0, 25.0, 75.0), (-3.2, 0.0, 3.2)

def _nearest(val: float, choices: tuple[float, ...]) -> float: return min(choices, key=lambda c: abs(c - val))
def _clamp_spawn_clear(x: float, z: float, sx: float, sz: float, min_dist: float = 8.0) -> Tuple[float, float]:
    d = math.hypot(x - sx, z - sz)
    if d >= min_dist: return x, z
    ang = math.atan2(z - sz, x - sx) if d > 0.01 else -1.57
    return sx + math.cos(ang) * (min_dist + 1.5), sz + math.sin(ang) * (min_dist + 1.5)

def _fix_position(kind: str, layout: str, x: float, y: float, z: float, sx: float, sz: float) -> List[float]:
    if layout == "city_grid":
        if kind in ("building", "obstacle") and (min(abs(x - r) for r in ROAD_LINES) < 10.5 or min(abs(z - r) for r in ROAD_LINES) < 10.5):
            x, z = _nearest(x, BLOCK_CENTERS) + (6.5 if x % 2 >= 1 else -6.5), _nearest(z, BLOCK_CENTERS) + (6.5 if z % 2 >= 1 else -6.5)
        elif kind in ("vehicle", "checkpoint", "jump_ramp"):
            if abs(_nearest(x, ROAD_LINES) - x) <= abs(_nearest(z, ROAD_LINES) - z): x = _nearest(x, ROAD_LINES)
            else: z = _nearest(z, ROAD_LINES)
    elif layout == "three_lane_track":
        if kind == "building": x = (12.5 if x >= 0 else -12.5) if abs(x) < 10.5 else x
        else: x, z = _nearest(x, LANES), min(z, -12.0)
    elif layout == "race_circuit" and kind == "building" and 16.0 < math.hypot(x, z) < 66.0:
        ang = math.atan2(z, x) if math.hypot(x, z) > 0.1 else 0.7
        x, z = math.cos(ang) * 72.0, math.sin(ang) * 72.0
    x, z = _clamp_spawn_clear(x, z, sx, sz, 9.5 if kind in ("building", "enemy", "boss", "obstacle") else 6.0)
    y_out = max(0.7, y) if kind in ("collectible", "powerup") else (0.0 if kind in ("building", "vehicle", "jump_ramp", "checkpoint", "obstacle", "boss") else max(0.0, y))
    return [round(x, 2), round(y_out, 2), round(z, 2)]
def _supplement_cartoon(layout: str, rig: str, count_needed: int, start_idx: int) -> List[Dict[str, Any]]:
    extras: List[Dict[str, Any]] = []
    for k in range(count_needed):
        idx = start_idx + k
        if layout == "three_lane_track":
            lane, z = LANES[(k // 4) % 3], -14.0 - k * 5.0
            step = k % 9
            if step < 5:
                u = step / 4.0
                extras.append({"id": f"arc-{idx}", "kind": "collectible", "modelId": "gold_coin", "behavior": "spin", "position": [lane, round(0.9 + 2.4 * 4 * u * (1 - u), 2), z], "rotation": [0, 0, 0], "scale": 1.0, "points": 25})
            elif step == 5:
                extras.append({"id": f"rmp-{idx}", "kind": "jump_ramp", "modelId": "train_ramp", "behavior": "static", "position": [lane, 0.0, z + 5.5], "rotation": [0, 0, 0], "scale": 1.0})
                extras.append({"id": f"trk-{idx}", "kind": "obstacle", "modelId": "subway_train", "behavior": "moving_train" if (k // 9) % 2 == 1 else "static", "position": [lane, 0.0, z - 4.0], "rotation": [0, 0, 0], "scale": 1.0, "speed": 11.0})
                extras.append({"id": f"top-{idx}", "kind": "collectible", "modelId": "gold_coin", "behavior": "spin", "position": [lane, 3.6, z - 4.0], "rotation": [0, 0, 0], "scale": 1.0, "points": 30})
            elif step == 6:
                extras.append({"id": f"hi-{idx}", "kind": "obstacle", "modelId": "high_barrier" if k % 2 == 0 else "street_barrier", "behavior": "static", "position": [LANES[((k // 4) + 1) % 3], 0.0, z], "rotation": [0, 0, 0], "scale": 1.0})
            elif step == 7:
                extras.append({"id": f"pw-{idx}", "kind": "powerup", "modelId": "powerup_jetpack" if k % 2 == 0 else "powerup_magnet", "behavior": "spin", "position": [LANES[((k // 4) + 2) % 3], 1.1, z], "rotation": [0, 0, 0], "scale": 1.0, "points": 50})
                if k % 4 == 1:
                    extras.append({"id": f"grd-{idx}", "kind": "enemy", "modelId": "chaser_guard", "behavior": "chase", "position": [LANES[(k // 3) % 3], 0.0, z - 8.0], "rotation": [0, 0, 0], "scale": 1.0, "speed": 5.5})
            else:
                extras.append({"id": f"bldg-{idx}", "kind": "building", "modelId": "city_building", "behavior": "static", "position": [-12.5 if k % 2 == 0 else 12.5, 0.0, z], "rotation": [0, 0, 0], "scale": 1.0})
        elif layout == "city_grid":
            road, pos_along = ROAD_LINES[(idx // 2) % 5], -80.0 + ((idx * 17) % 160)
            kind = ("vehicle", "collectible", "building", "checkpoint", "enemy", "powerup")[idx % 6]
            px, pz = (BLOCK_CENTERS[idx % 4] + 6.5, BLOCK_CENTERS[(idx // 2) % 4] - 6.5) if kind == "building" else ((road, pos_along) if idx % 2 == 0 else (pos_along, road))
            mid = "police_cruiser" if kind == "vehicle" and idx % 2 == 0 else MODEL_BY_KIND[kind]
            extras.append({"id": f"city-{idx}", "kind": kind, "modelId": mid, "behavior": "lane_traffic" if kind == "vehicle" else ("patrol" if kind == "enemy" else "spin"), "position": [px, 1.0 if kind in ("collectible", "powerup") else 0.0, pz], "rotation": [0, 0, 0], "scale": 1.0, "speed": 10.0, "points": 35})
        else:
            ang, rad = idx * 0.65, 16.0 + (idx % 5) * 9.5
            kind = ("collectible", "enemy", "building", "jump_ramp", "powerup")[idx % 5]
            mid = "spaceship" if rig == "flight_combat" and kind == "enemy" else MODEL_BY_KIND[kind]
            extras.append({"id": f"bio-{idx}", "kind": kind, "modelId": mid, "behavior": "chase" if kind == "enemy" else "spin", "position": [round(math.cos(ang) * rad, 2), 1.0 if kind in ("collectible", "powerup") else 0.0, round(math.sin(ang) * rad, 2)], "rotation": [0, round(-ang, 2), 0], "scale": 1.0, "points": 30})
    return extras
def _ensure_passable_lanes(entities: List[Dict[str, Any]], layout: str) -> List[Dict[str, Any]]:
    if layout != "three_lane_track": return entities
    slices, bldgs, safe_ents = {}, set(), []
    for ent in entities:
        if ent["kind"] == "building":
            key = (1 if ent["position"][0] >= 0 else -1, round(ent["position"][2] / 7.0))
            if key in bldgs: continue
            bldgs.add(key); safe_ents.append(ent); continue
        if ent["kind"] not in ("obstacle", "enemy", "vehicle"):
            safe_ents.append(ent); continue
        lane, z_bucket = _nearest(ent["position"][0], LANES), round(ent["position"][2] / 10.0)
        blocked = slices.setdefault(z_bucket, set())
        if lane in blocked or len(blocked) >= 2: continue
        blocked.add(lane); safe_ents.append(ent)
    return safe_ents

def sanitize_world_json(raw: Dict[str, Any], prompt: str = "") -> Dict[str, Any]:
    theme = raw.get("theme") if raw.get("theme") in CARTOON_THEMES else "sunny_city"
    light = raw.get("lightingPreset") if raw.get("lightingPreset") in {"sunset", "night", "city", "dawn"} else "sunset"
    layout = raw.get("worldLayout") if raw.get("worldLayout") in {"city_grid", "three_lane_track", "race_circuit", "open_biome"} else "three_lane_track"
    rig = raw.get("playerRig") if raw.get("playerRig") in {"arcade_car", "three_lane_runner", "third_person_action", "flight_combat"} else "three_lane_runner"
    weather = raw.get("weather") if raw.get("weather") in {"clear", "rain", "snow", "embers", "sandstorm", "fireflies"} else "clear"
    spawn_raw = dict(raw.get("spawn")) if isinstance(raw.get("spawn"), dict) else {}
    sp_pos = spawn_raw.get("position") if isinstance(spawn_raw.get("position"), list) and len(spawn_raw["position"]) == 3 else [0.0, 8.0 if rig == "flight_combat" else 1.5, 0.0]
    sx, sy, sz = float(sp_pos[0]), float(sp_pos[1]), float(sp_pos[2])

    raw_ents = list(raw.get("entities") or []) if isinstance(raw.get("entities"), list) else []
    if len(raw_ents) < 32:
        raw_ents.extend(_supplement_cartoon(layout, rig, 34 - len(raw_ents), len(raw_ents) + 1))

    fixed = []
    for i, item in enumerate(raw_ents[:50]):
        if not isinstance(item, dict): continue
        kind = item.get("kind") if item.get("kind") in MODEL_BY_KIND else "collectible"
        mid = str(item.get("modelId") or MODEL_BY_KIND[kind]).lower()
        if mid not in VALID_MODELS: mid = MODEL_BY_KIND[kind]
        raw_beh = str(item.get("behavior") or ("spin" if kind in ("collectible", "powerup") else "static")).lower().strip()
        beh = BEHAVIOR_ALIASES.get(raw_beh, raw_beh)
        if beh not in VALID_BEHAVIORS: beh = "lane_traffic" if kind == "vehicle" else ("patrol" if kind == "enemy" else "static")
        p = item.get("position") if isinstance(item.get("position"), list) and len(item["position"]) == 3 else [0.0, 0.0, -16.0 - i * 4.0]
        r = item.get("rotation") if isinstance(item.get("rotation"), list) and len(item["rotation"]) == 3 else [0.0, 0.0, 0.0]
        fixed.append({
            "id": str(item.get("id") or f"ent-{i}"), "kind": kind, "modelId": mid,
            "variant": str(item["variant"]) if item.get("variant") else None, "behavior": beh,
            "position": _fix_position(kind, layout, float(p[0]), float(p[1]), float(p[2]), sx, sz),
            "rotation": [float(r[0]), float(r[1]), float(r[2])],
            "scale": max(0.25, min(8.0, float(item.get("scale") or 1.0))), "speed": max(0.0, min(60.0, float(item.get("speed") or 6.0))),
            "hp": max(1, min(2000, int(item.get("hp") or 40))), "points": max(0, min(1000, int(item.get("points") or 25))),
            "color": str(item.get("color") or "#D96B27"), "patrolRadius": max(1.0, min(80.0, float(item.get("patrolRadius") or 14.0))),
        })

    fixed = _ensure_passable_lanes(fixed, layout)
    default_pm = {"arcade_car": "cartoon_car", "three_lane_runner": "cartoon_character", "flight_combat": "spaceship", "third_person_action": "cartoon_character"}[rig]
    p_mid, rules = str(raw.get("playerModelId") or default_pm).lower(), dict(raw.get("rules")) if isinstance(raw.get("rules"), dict) else {}
    sign = str(raw.get("signLabel") or ({"wild_west": "SALOON", "desert_canyon": "CANYON", "tropical_beach": "ALOHA", "candy_sky": "CANDY", "tokyo_festival": "TOKYO"}.get(theme, "METRO")))[:12].upper()
    extras_dict = {k: dict(raw[k]) for k in ("themeConfig", "entitySkins", "mechanics", "hudLabels", "palette", "worldPalette", "playerConfig", "enemyConfig", "worldProps", "bossConfig") if isinstance(raw.get(k), dict)}
    extras_list = {k: list(raw[k]) for k in ("playerParts", "enemyParts", "obstacleParts", "collectibleParts", "powerupsEnabled") if isinstance(raw.get(k), list)}
    mode_val = str(raw.get("mode") or raw.get("archetype") or "endless_runner")
    dim_val = "2d" if str(raw.get("dimension") or "").lower() == "2d" or mode_val.startswith("2d_") else "3d"
    mode_map = {"sky_shooter": ("open_biome", "flight_combat", "eliminate_targets"), "arena_action": ("open_biome", "third_person_action", "survive_waves"), "vehicle_pursuit": ("city_grid", "arcade_car", "distance_race"), "endless_runner": ("three_lane_track", "three_lane_runner", "collect_and_escape"), "open_world_sandbox": ("city_grid", "third_person_action", "open_world_missions"), "2d_grid_puzzle": ("open_biome", "third_person_action", "collect_and_escape"), "2d_platformer": ("open_biome", "third_person_action", "collect_and_escape"), "2d_topdown_action": ("open_biome", "third_person_action", "survive_waves"), "2d_endless_dash": ("three_lane_track", "three_lane_runner", "distance_race"), "2d_space_arcade": ("open_biome", "flight_combat", "eliminate_targets")}
    layout, rig, default_goal = mode_map.get(mode_val, (layout, rig, "collect_and_escape"))
    goal_type = raw.get("goalType") if raw.get("goalType") in {"eliminate_targets", "survive_waves", "collect_and_escape", "distance_race", "open_world_missions"} else default_goal
    grav2d = float(raw.get("gravity2d") if raw.get("gravity2d") is not None else (0.0 if mode_val in ("2d_topdown_action", "2d_space_arcade", "2d_grid_puzzle") else 26.0))
    return {"title": str(raw.get("title") or (prompt[:38].title() if prompt else "Subway Dash World")), "dimension": dim_val, "gravity2d": grav2d, "parallaxTheme": str(raw.get("parallaxTheme") or "urban_dusk"), "gridSize": max(3, min(6, int(raw.get("gridSize") or 4))), "targetTile": max(64, int(raw.get("targetTile") or 2048)), "theme": theme, "signLabel": sign, "lightingPreset": light, "weather": weather,
        "worldLayout": layout, "playerRig": rig, "playerModelId": p_mid if p_mid in VALID_MODELS else default_pm, "archetype": str(raw.get("archetype") or mode_val),
        "mode": mode_val, "themeId": str(raw.get("themeId") or "subway_trains"), "playerType": str(raw.get("playerType") or "runner_kid"),
        "obstacleType": str(raw.get("obstacleType") or "subway_train"), "enemyType": str(raw.get("enemyType") or "chaser_guard"), "collectibleType": str(raw.get("collectibleType") or "gold_coin"),
        "objectiveText": str(raw.get("objectiveText") or "Collect 25 Relics"), "winTarget": int(raw.get("winTarget") or 25), "goalType": goal_type,
        "targetCount": max(3, min(200, int(raw.get("targetCount") or raw.get("winTarget") or 15))), "waveCount": max(1, min(10, int(raw.get("waveCount") or 3))),
        "targetDistance": max(200, min(10000, int(raw.get("targetDistance") or 1500))), "canShoot": bool(raw.get("canShoot", False)), "enemiesShoot": bool(raw.get("enemiesShoot", False)),
        "vehiclesEnabled": bool(raw.get("vehiclesEnabled", mode_val == "open_world_sandbox")), "wantedSystem": bool(raw.get("wantedSystem", mode_val == "open_world_sandbox")),
        "speed": float(raw.get("speed") or 12.0), "spawnRate": float(raw.get("spawnRate") or 1.0), "spawn": {"position": [sx, sy, sz], "yaw": float(spawn_raw.get("yaw", 0.0))}, "entities": fixed,
        "rules": {"winCondition": rules.get("winCondition") if rules.get("winCondition") in {"target_score", "checkpoints", "defeat_boss", "survive_time"} else "target_score", "targetScore": max(50, min(50000, int(rules.get("targetScore", 800)))), "timeLimit": max(20, min(600, int(rules.get("timeLimit", 90))))},
        **extras_dict, **extras_list,
    }
def world_json_to_game_config(world: Any, model_id: str) -> GameConfig:
    d = world.model_dump() if hasattr(world, "model_dump") else dict(world)
    rig_to_mode = {"arcade_car": "time_trial_racer", "three_lane_runner": "arcade_runner", "flight_combat": "arena_shooter", "third_person_action": "platformer"}
    sky, fog, ground, amb = THEME_PALETTES.get(d["theme"], THEME_PALETTES["sunny_city"])
    return GameConfig(
        title=d["title"], dimension=d.get("dimension", "3d"), mode=d.get("mode"), game_mode=rig_to_mode.get(d["playerRig"], "arcade_runner"), camera_mode="follow", world_json=world,
        generation_source="ai_world_json", model_id=model_id, rules=GameRules(time_limit_sec=d["rules"]["timeLimit"]),
        environment=EnvironmentConfig(sky_color=sky, fog_color=fog, ground_color=ground, ambient_intensity=amb),
        player=PlayerConfig(speed=14.0 if d["playerRig"] == "arcade_car" else 11.5, rig=d["playerRig"]), goal=GoalConfig(position=[0.0, 2.0, -32.0]),
    )
