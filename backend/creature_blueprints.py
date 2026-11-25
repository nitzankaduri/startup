from typing import Any, Dict, Optional

POWERUPS_ALL = ["shield", "triple_shot", "magnet", "jetpack_boost"]


def match_creative_creature_spec(prompt: str = "") -> Optional[Dict[str, Any]]:
    """Returns rich compositional parts[] blueprints and bosses for creative Hebrew & English prompts."""
    p = (prompt or "").lower()

    if any(k in p for k in ("קוף", "ג'ירפ", "גירפ", "בננ", "monkey", "giraffe", "banana")):
        return {
            "title": "קוף משליך בננות" if any("\u0590" <= c <= "\u05ff" for c in p) else "Monkey Banana Dash",
            "themeId": "pirate_island", "mode": "arena_action", "theme": "tropical_beach", "signLabel": "JUNGLE",
            "worldLayout": "open_biome", "playerRig": "third_person_action", "goalType": "eliminate_targets", "targetCount": 15, "objectiveText": "הבס 15 ג'ירפות",
            "canShoot": True, "enemiesShoot": True, "speed": 12.5, "powerupsEnabled": POWERUPS_ALL,
            "palette": {"sky": "#0EA5E9", "ground": "#4ADE80", "track": "#78350F", "primary": "#92400E", "secondary": "#FACC15", "accent": "#D96B27"},
            "playerParts": [
                {"shape": "sphere", "pos": [0, 0.9, 0], "scale": [0.72, 0.85, 0.65], "color": "#92400E"},
                {"shape": "sphere", "pos": [0, 1.52, 0], "scale": [0.58, 0.56, 0.56], "color": "#92400E"},
                {"shape": "sphere", "pos": [0, 1.45, 0.24], "scale": [0.42, 0.3, 0.24], "color": "#FDE68A"},
                {"shape": "sphere", "pos": [-0.34, 1.56, 0], "scale": [0.22, 0.22, 0.12], "color": "#FDE68A"},
                {"shape": "sphere", "pos": [0.34, 1.56, 0], "scale": [0.22, 0.22, 0.12], "color": "#FDE68A"},
                {"shape": "cylinder", "pos": [0.42, 1.0, 0.28], "scale": [0.14, 0.55, 0.14], "rot": [0.8, 0, 0], "color": "#FACC15", "anim": "bob"},
            ],
            "enemyParts": [
                {"shape": "box", "pos": [0, 0.8, 0], "scale": [0.75, 0.75, 1.2], "color": "#FBBF24"},
                {"shape": "cylinder", "pos": [0, 1.75, 0.3], "scale": [0.28, 1.4, 0.28], "color": "#FBBF24", "anim": "bob"},
                {"shape": "box", "pos": [0, 2.55, 0.45], "scale": [0.42, 0.36, 0.62], "color": "#D97706"},
            ],
            "obstacleParts": [
                {"shape": "cylinder", "pos": [0, 0.8, 0], "scale": [1.5, 1.6, 1.5], "color": "#78350F"},
                {"shape": "sphere", "pos": [0, 1.85, 0], "scale": [2.2, 1.1, 2.2], "color": "#16A34A", "anim": "bob"},
            ],
            "collectibleParts": [{"shape": "cylinder", "pos": [0, 0, 0], "scale": [0.32, 0.75, 0.24], "rot": [0, 0, 0.45], "color": "#FACC15", "anim": "spin"}],
            "bossConfig": {"bossName": "מלך הג'ירפות", "hp": 220, "parts": [
                {"shape": "box", "pos": [0, 1.4, 0], "scale": [1.8, 1.6, 2.4], "color": "#F59E0B"},
                {"shape": "cylinder", "pos": [0, 3.2, 0.4], "scale": [0.55, 2.8, 0.55], "color": "#FBBF24"},
                {"shape": "cone", "pos": [0, 4.9, 0.4], "scale": [0.9, 0.7, 0.9], "color": "#D96B27", "metallic": True},
            ]},
        }

    if any(k in p for k in ("דרקון", "טירה", "dragon", "castle")):
        return {
            "title": "דרקון יורק אש בטירה" if any("\u0590" <= c <= "\u05ff" for c in p) else "Dragon Castle Blaze",
            "themeId": "lava_dragon", "mode": "sky_shooter", "theme": "desert_canyon", "signLabel": "DRAGON",
            "worldLayout": "open_biome", "playerRig": "flight_combat", "goalType": "eliminate_targets", "targetCount": 15, "objectiveText": "הבס 15 אויבי טירה",
            "canShoot": True, "enemiesShoot": True, "speed": 13.0, "powerupsEnabled": POWERUPS_ALL,
            "palette": {"sky": "#7C2D12", "ground": "#9A3412", "track": "#451A03", "primary": "#DC2626", "secondary": "#F59E0B", "accent": "#FBBF24"},
            "playerParts": [
                {"shape": "box", "pos": [0, 1.0, 0], "scale": [0.95, 0.8, 1.5], "color": "#DC2626"},
                {"shape": "box", "pos": [0, 1.35, 0.9], "scale": [0.65, 0.55, 0.75], "color": "#B91C1C"},
                {"shape": "box", "pos": [-1.05, 1.25, 0], "scale": [1.4, 0.14, 0.9], "color": "#F59E0B", "anim": "flap"},
                {"shape": "box", "pos": [1.05, 1.25, 0], "scale": [1.4, 0.14, 0.9], "color": "#F59E0B", "anim": "flap"},
            ],
            "enemyParts": [
                {"shape": "box", "pos": [0, 0.9, 0], "scale": [0.85, 1.3, 0.7], "color": "#475569", "metallic": True},
                {"shape": "sphere", "pos": [0, 1.8, 0], "scale": [0.55, 0.55, 0.55], "color": "#94A3B8", "metallic": True},
            ],
            "obstacleParts": [
                {"shape": "box", "pos": [0, 1.2, 0], "scale": [2.0, 2.4, 1.4], "color": "#57534E"},
                {"shape": "cone", "pos": [0, 2.75, 0], "scale": [1.8, 0.9, 1.4], "color": "#B91C1C"},
            ],
            "bossConfig": {"bossName": "דרקון האבן העתיק", "hp": 260, "parts": [
                {"shape": "box", "pos": [0, 1.6, 0], "scale": [2.4, 2.0, 2.8], "color": "#7F1D1D"},
                {"shape": "box", "pos": [-2.1, 2.2, 0], "scale": [2.4, 0.25, 1.4], "color": "#D97706", "anim": "flap"},
                {"shape": "box", "pos": [2.1, 2.2, 0], "scale": [2.4, 0.25, 1.4], "color": "#D97706", "anim": "flap"},
            ]},
        }

    if any(k in p for k in ("המבורגר", "בורגר", "burger", "hamburger")):
        return {
            "title": "המבורגר מעופף בחלל" if any("\u0590" <= c <= "\u05ff" for c in p) else "Space Burger Blitz",
            "themeId": "space_shooter", "mode": "sky_shooter", "theme": "tokyo_festival", "signLabel": "BURGER",
            "worldLayout": "open_biome", "playerRig": "flight_combat", "goalType": "eliminate_targets", "targetCount": 15, "objectiveText": "הבס 15 צלחות מעופפות",
            "canShoot": True, "enemiesShoot": True, "speed": 15.5, "powerupsEnabled": POWERUPS_ALL,
            "palette": {"sky": "#0F172A", "ground": "#1E293B", "track": "#334155", "primary": "#F59E0B", "secondary": "#10B981", "accent": "#EF4444"},
            "playerParts": [
                {"shape": "cylinder", "pos": [0, 0.65, 0], "scale": [1.3, 0.26, 1.3], "color": "#F59E0B"},
                {"shape": "cylinder", "pos": [0, 0.88, 0], "scale": [1.4, 0.16, 1.4], "color": "#22C55E"},
                {"shape": "cylinder", "pos": [0, 1.05, 0], "scale": [1.35, 0.24, 1.35], "color": "#78350F"},
                {"shape": "cylinder", "pos": [0, 1.24, 0], "scale": [1.38, 0.12, 1.38], "color": "#FACC15"},
                {"shape": "sphere", "pos": [0, 1.46, 0], "scale": [1.3, 0.56, 1.3], "color": "#F59E0B", "anim": "bob"},
            ],
            "enemyParts": [
                {"shape": "cylinder", "pos": [0, 1.2, 0], "scale": [1.6, 0.4, 1.6], "color": "#6366F1", "metallic": True, "anim": "spin"},
                {"shape": "sphere", "pos": [0, 1.5, 0], "scale": [0.9, 0.7, 0.9], "color": "#38BDF8", "metallic": True},
            ],
            "bossConfig": {"bossName": "השף החללי", "hp": 240, "parts": [
                {"shape": "torus", "pos": [0, 1.8, 0], "scale": [2.6, 2.6, 1.2], "rot": [1.57, 0, 0], "color": "#EF4444", "anim": "spin"},
                {"shape": "sphere", "pos": [0, 2.1, 0], "scale": [2.0, 2.0, 2.0], "color": "#FFFBEB"},
            ]},
        }
    return None
