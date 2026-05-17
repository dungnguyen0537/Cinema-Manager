import os
import re

entity_dir = "cinema-booking-api/src/main/java/com/cinema"

def extract_fields(content):
    fields = []
    # Match private Type name;
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
                    "path": root
                })

for e in entities:
    dao_dir = e["path"].replace("\\entity", "\\repository").replace("/entity", "/repository")
    if not os.path.exists(dao_dir):
        os.makedirs(dao_dir)
    
    dao_package = e["package"].replace(".entity", ".repository")
    
    # 1. Generate Dao Interface
    dao_content = f"""package {dao_package};

import {e['package']}.{e['class_name']};
import java.util.List;
import java.util.Optional;

public interface {e['name']}Dao {{
    {e['class_name']} save({e['class_name']} entity);
    Optional<{e['class_name']}> findById(Long id);
    List<{e['class_name']}> findAll();
    void deleteById(Long id);
}}
"""
    with open(os.path.join(dao_dir, f"{e['name']}Dao.java"), 'w', encoding='utf-8') as f:
        f.write(dao_content)

    # 2. Generate DaoImpl
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
    
    for t, n in e['fields']:
        if t.startswith("Set") or t.startswith("List"): continue
        col_name = to_snake_case(n)
        insert_cols.append(col_name)
        insert_vals.append(f":{n}")
        update_cols.append(f"{col_name} = :{n}")
        
    insert_sql = f"INSERT INTO {table_name} ({', '.join(insert_cols)}) VALUES ({', '.join(insert_vals)})"
    update_sql = f"UPDATE {table_name} SET {', '.join(update_cols)} WHERE id = :id"
    
    impl_content = f"""package {dao_package};

import {e['package']}.{e['class_name']};
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.BeanPropertySqlParameterSource;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class {e['name']}DaoImpl implements {e['name']}Dao {{

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final {e['name']}RowMapper rowMapper = new {e['name']}RowMapper();

    @Override
    public {e['class_name']} save({e['class_name']} entity) {{
        if (entity.getId() == null) {{
            String sql = "{insert_sql}";
            KeyHolder keyHolder = new GeneratedKeyHolder();
            jdbcTemplate.update(sql, new BeanPropertySqlParameterSource(entity), keyHolder, new String[]{{"id"}});
            entity.setId(keyHolder.getKey().longValue());
        }} else {{
            String sql = "{update_sql}";
            jdbcTemplate.update(sql, new BeanPropertySqlParameterSource(entity));
        }}
        return entity;
    }}

    @Override
    public Optional<{e['class_name']}> findById(Long id) {{
        String sql = "SELECT * FROM {table_name} WHERE id = :id";
        List<{e['class_name']}> results = jdbcTemplate.query(sql, new MapSqlParameterSource("id", id), rowMapper);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }}

    @Override
    public List<{e['class_name']}> findAll() {{
        String sql = "SELECT * FROM {table_name}";
        return jdbcTemplate.query(sql, rowMapper);
    }}

    @Override
    public void deleteById(Long id) {{
        String sql = "DELETE FROM {table_name} WHERE id = :id";
        jdbcTemplate.update(sql, new MapSqlParameterSource("id", id));
    }}
}}
"""
    with open(os.path.join(dao_dir, f"{e['name']}DaoImpl.java"), 'w', encoding='utf-8') as f:
        f.write(impl_content)

    # 3. Generate RowMapper
    mapper_content = f"""package {dao_package};

import {e['package']}.{e['class_name']};
import org.springframework.jdbc.core.RowMapper;
import java.sql.ResultSet;
import java.sql.SQLException;

public class {e['name']}RowMapper implements RowMapper<{e['class_name']}> {{
    @Override
    public {e['class_name']} mapRow(ResultSet rs, int rowNum) throws SQLException {{
        {e['class_name']} entity = new {e['class_name']}();
        entity.setId(rs.getLong("id"));
"""
    for t, n in e['fields']:
        if t.startswith("Set") or t.startswith("List"): continue
        col_name = to_snake_case(n)
        if t == "String":
            mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getString("{col_name}"));\n'
        elif t == "Integer" or t == "int":
            mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getObject("{col_name}") != null ? rs.getInt("{col_name}") : null);\n'
        elif t == "Long" or t == "long":
            mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getObject("{col_name}") != null ? rs.getLong("{col_name}") : null);\n'
        elif t == "BigDecimal":
            mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getBigDecimal("{col_name}"));\n'
        elif t == "LocalDateTime":
            mapper_content += f'        if(rs.getTimestamp("{col_name}") != null) entity.set{n[0].upper()+n[1:]}(rs.getTimestamp("{col_name}").toLocalDateTime());\n'
        elif t == "LocalDate":
            mapper_content += f'        if(rs.getDate("{col_name}") != null) entity.set{n[0].upper()+n[1:]}(rs.getDate("{col_name}").toLocalDate());\n'
        elif t == "Boolean" or t == "boolean":
            mapper_content += f'        entity.set{n[0].upper()+n[1:]}(rs.getBoolean("{col_name}"));\n'
            
    mapper_content += """        return entity;
    }
}
"""
    with open(os.path.join(dao_dir, f"{e['name']}RowMapper.java"), 'w', encoding='utf-8') as f:
        f.write(mapper_content)

print("DAO generation complete!")
