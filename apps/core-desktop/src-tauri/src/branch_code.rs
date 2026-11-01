use chrono::{DateTime, FixedOffset};
use regex::Regex;

pub fn generate_branch_code(
    business_id: &str,
    existing_codes: &[String],
    district: Option<&str>,
    location: &str,
    now: DateTime<FixedOffset>,
) -> String {
    let mut max_seq = 0;
    let re_new = Regex::new(r"-B(\d+)-").unwrap();
    let re_legacy = Regex::new(r"BR-(\d+)").unwrap();

    for code in existing_codes {
        if let Some(caps) = re_new.captures(code) {
            if let Ok(seq) = caps[1].parse::<i32>() {
                if seq > max_seq {
                    max_seq = seq;
                }
            }
        } else if let Some(caps) = re_legacy.captures(code) {
            if let Ok(seq) = caps[1].parse::<i32>() {
                if seq > max_seq {
                    max_seq = seq;
                }
            }
        } else if let Ok(seq) = code.parse::<i32>() {
            if seq > max_seq {
                max_seq = seq;
            }
        }
    }

    let next_seq = max_seq + 1;
    let seq_str = if next_seq < 100 {
        format!("B{:02}", next_seq)
    } else {
        format!("B{:03}", next_seq)
    };

    let clean_district = district.map(normalize_place).unwrap_or_default();
    let place = if clean_district.chars().count() >= 3 {
        clean_district.chars().take(3).collect::<String>()
    } else {
        let clean_location = normalize_place(location);
        if clean_location.chars().count() >= 3 {
            clean_location.chars().take(3).collect::<String>()
        } else {
            "XXX".to_string()
        }
    };

    let yymm = now.format("%y%m").to_string();

    format!("{}-{}-{}-{}", business_id, seq_str, place, yymm)
}

fn normalize_place(s: &str) -> String {
    let mut res = String::new();
    for c in s.chars() {
        let base = match c {
            'á' | 'à' | 'â' | 'ä' | 'ã' | 'å' | 'ā' => 'a',
            'é' | 'è' | 'ê' | 'ë' | 'ē' => 'e',
            'í' | 'ì' | 'î' | 'ï' | 'ī' => 'i',
            'ó' | 'ò' | 'ô' | 'ö' | 'õ' | 'ō' => 'o',
            'ú' | 'ù' | 'û' | 'ü' | 'ū' => 'u',
            'ý' | 'ÿ' => 'y',
            'ñ' => 'n',
            'ç' => 'c',
            'Á' | 'À' | 'Â' | 'Ä' | 'Ã' | 'Å' | 'Ā' => 'A',
            'É' | 'È' | 'Ê' | 'Ë' | 'Ē' => 'E',
            'Í' | 'Ì' | 'Î' | 'Ï' | 'Ī' => 'I',
            'Ó' | 'Ò' | 'Ô' | 'Ö' | 'Õ' | 'Ō' => 'O',
            'Ú' | 'Ù' | 'Û' | 'Ü' | 'Ū' => 'U',
            'Ý' => 'Y',
            'Ñ' => 'N',
            'Ç' => 'C',
            other => other,
        };
        if base.is_ascii_alphabetic() {
            res.push(base.to_ascii_uppercase());
        }
    }
    res
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn tz3() -> FixedOffset {
        FixedOffset::east_opt(3 * 3600).unwrap()
    }

    #[test]
    fn test_first_branch() {
        let now = tz3().with_ymd_and_hms(2026, 10, 15, 12, 0, 0).unwrap();
        let code = generate_branch_code("AFYA-2847", &[], Some("Ilala"), "Ubungo Dar", now);
        assert_eq!(code, "AFYA-2847-B01-ILA-2610");
    }

    #[test]
    fn test_sequence_gaps_and_max() {
        let now = tz3().with_ymd_and_hms(2026, 10, 15, 12, 0, 0).unwrap();
        let existing = vec![
            "AFYA-2847-B01-ILA-2609".to_string(),
            "AFYA-2847-B03-KIN-2609".to_string(),
        ];
        let code = generate_branch_code("AFYA-2847", &existing, Some("Kinondoni"), "Dar", now);
        assert_eq!(code, "AFYA-2847-B04-KIN-2610");
    }

    #[test]
    fn test_diacritics_and_swahili_districts() {
        let now = tz3().with_ymd_and_hms(2026, 10, 15, 12, 0, 0).unwrap();
        let code = generate_branch_code("AFYA-1001", &[], Some("Mbaráli"), "Location", now);
        assert_eq!(code, "AFYA-1001-B01-MBA-2610");
    }

    #[test]
    fn test_short_or_empty_district_fallback() {
        let now = tz3().with_ymd_and_hms(2026, 10, 15, 12, 0, 0).unwrap();
        let code1 = generate_branch_code("AFYA-1001", &[], Some("Ki"), "Mwanza City", now);
        assert_eq!(code1, "AFYA-1001-B01-MWA-2610");

        let code2 = generate_branch_code("AFYA-1001", &[], None, "Ab", now);
        assert_eq!(code2, "AFYA-1001-B01-XXX-2610");
    }

    #[test]
    fn test_month_year_rollover() {
        let dec = tz3().with_ymd_and_hms(2026, 12, 31, 23, 59, 59).unwrap();
        let code_dec = generate_branch_code("AFYA-1001", &[], Some("Ilala"), "Dar", dec);
        assert_eq!(code_dec, "AFYA-1001-B01-ILA-2612");

        let jan = tz3().with_ymd_and_hms(2027, 1, 1, 0, 0, 0).unwrap();
        let code_jan = generate_branch_code("AFYA-1001", &[], Some("Ilala"), "Dar", jan);
        assert_eq!(code_jan, "AFYA-1001-B01-ILA-2701");
    }
}
