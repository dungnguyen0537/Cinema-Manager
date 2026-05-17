import os
import re

entity_dir = "cinema-booking-api/src/main/java/com/cinema"

def extract_fields(content):
    fields = []
    matches = re.finditer(r'private\s+([A-Za-z0-9_<>]+)\s+([A-Za-z0-9_]+)\s*(?:=.*?)?;', content)
    for match in matches:
        fields.append((match.group(1), match.group(2)))
    return fields

def to_snake_case(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

entities = []
for root, dirs, files in os.walk(entity_dir):
    for file in files:
        if file.endswith("Entity.java") and file != "BaseEntity.java":
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
                package = re.search(r'package\s+(.*?);', content).group(1)
                class_name = file.split(".")[0]
                name = class_name.replace("Entity", "")
                fields = extract_fields(content)
                entities.append({
                    "package": package,
                    "class_name": class_name,
                    "name": name,
                    "fields": fields,
                    "path": root.replace("\\\\", "/")
                })

for e in entities:
    # Use normalized forward slash path to make replace work reliably
    path_normalized = e["path"].replace("\\\\", "/").replace("\\", "/")
    dao_dir = path_normalized.replace("/entity", "/repository")
    dao_package = e["package"].replace(".entity", ".repository")
    
    table_name = to_snake_case(e['name']) + "s"
    if table_name.endswith("ys"): table_name = table_name[:-2] + "ies"
    if e['name'] == "Role": table_name = "roles"
    if e['name'] == "Seat": table_name = "seats"
    if e['name'] == "Showtime": table_name = "showtimes"
    if e['name'] == "Ticket": table_name = "tickets"
    if e['name'] == "Promotion": table_name = "promotions"
    if e['name'] == "Room": table_name = "rooms"
    if e['name'] == "Cinema": table_name = "cinemas"
    if e['name'] == "Genre": table_name = "genres"
    if e['name'] == "BookingSeat": table_name = "booking_seats"
    if e['name'] == "RefundTransaction": table_name = "refund_transactions"
    
    insert_cols = []
    insert_vals = []
    update_cols = []
    
    mapper_content = f"package {dao_package};\n\nimport {e['package']}.{e['class_name']};\nimport org.springframework.jdbc.core.RowMapper;\nimport java.sql.ResultSet;\nimport java.sql.SQLException;\n\npublic class {e['name']}RowMapper implements RowMapper<{e['class_name']}> {{\n    @Override\n    public {e['class_name']} mapRow(ResultSet rs, int rowNum) throws SQLException {{\n        {e['class_name']} entity = new {e['class_name']}();\n        entity.setId(rs.getLong(\"id\"));\n"
    
    for t, n in e['fields']:
        if t.startswith("Set") or t.startswith("List"): continue
        if t.endswith("Entity"):
            col_name = to_snake_case(n) + "_id"
            insert_cols.append(col_name)
            insert_vals.append(f":{n}Id")
            update_cols.append(f"{col_name} = :{n}Id")
            mapper_content += f'        if(rs.getObject("{col_name}") != null) {{\n            {t} rel = new {t}();\n            rel.setId(rs.getLong("{col_name}"));\n            entity.set{n[0].upper()+n[1:]}(rel);\n        }}\n'
        else:
            col_name = to_snake_case(n)
            insert_cols.append(col_name)
            insert_vals.append(f":{n}")
            update_cols.append(f"{col_name} = :{n}")
            if t == "String": mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getString("{col_name}"));\n'
            elif t == "Integer" or t == "int": mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getObject("{col_name}") != null ? rs.getInt("{col_name}") : null);\n'
            elif t == "Long" or t == "long": mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getObject("{col_name}") != null ? rs.getLong("{col_name}") : null);\n'
            elif t == "BigDecimal": mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getBigDecimal("{col_name}"));\n'
            elif t == "LocalDateTime": mapper_content += f'        if(rs.getTimestamp("{col_name}") != null) entity.set{n[0].upper()+n[1:]}(rs.getTimestamp("{col_name}").toLocalDateTime());\n'
            elif t == "LocalDate": mapper_content += f'        if(rs.getDate("{col_name}") != null) entity.set{n[0].upper()+n[1:]}(rs.getDate("{col_name}").toLocalDate());\n'
            elif t == "Boolean" or t == "boolean": mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getBoolean("{col_name}"));\n'

    mapper_content += "        return entity;\n    }\n}\n"
    with open(os.path.join(dao_dir, f"{e['name']}RowMapper.java"), 'w', encoding='utf-8') as f:
        f.write(mapper_content)
        
    impl_content = ""
    with open(os.path.join(dao_dir, f"{e['name']}DaoImpl.java"), 'r', encoding='utf-8') as f:
        impl_content = f.read()
        
    insert_sql = f"INSERT INTO {table_name} ({', '.join(insert_cols)}) VALUES ({', '.join(insert_vals)})"
    update_sql = f"UPDATE {table_name} SET {', '.join(update_cols)} WHERE id = :id"
    
    param_map_code = "org.springframework.jdbc.core.namedparam.MapSqlParameterSource params = new org.springframework.jdbc.core.namedparam.MapSqlParameterSource();\n"
    param_map_code += "        params.addValue(\"id\", entity.getId());\n"
    for t, n in e['fields']:
        if t.startswith("Set") or t.startswith("List"): continue
        if t.endswith("Entity"):
            param_map_code += f"        params.addValue(\"{n}Id\", entity.get{n[0].upper()+n[1:]}() != null ? entity.get{n[0].upper()+n[1:]}().getId() : null);\n"
        else:
            param_map_code += f"        params.addValue(\"{n}\", entity.get{n[0].upper()+n[1:]}());\n"
            
    impl_content = re.sub(r'public ' + e['class_name'] + r' save\(' + e['class_name'] + r' entity\) \{[\s\S]*?return entity;\s*\}', 
    f'''public {e['class_name']} save({e['class_name']} entity) {{
        {param_map_code}
        if (entity.getId() == null) {{
            String sql = "{insert_sql}";
            org.springframework.jdbc.support.KeyHolder keyHolder = new org.springframework.jdbc.support.GeneratedKeyHolder();
            jdbcTemplate.update(sql, params, keyHolder, new String[]{{"id"}});
            entity.setId(keyHolder.getKey().longValue());
        }} else {{
            String sql = "{update_sql}";
            jdbcTemplate.update(sql, params);
        }}
        return entity;
    }}''', impl_content)
    
    with open(os.path.join(dao_dir, f"{e['name']}DaoImpl.java"), 'w', encoding='utf-8') as f:
        f.write(impl_content)

print("Updated RowMappers and save methods to support foreign keys!")
