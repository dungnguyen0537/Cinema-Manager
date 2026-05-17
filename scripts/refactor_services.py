import os
import re
import glob

def extract_methods(content):
    # Matches public methods that are not constructors
    # Example: public TokenResponse register(RegisterRequest request) {
    # Handles generics, throws, annotations like @Transactional
    
    # We just need the method signature
    methods = []
    # Find all public methods
    # Simple regex for method signature: public <return_type> <name>(<args>)
    pattern = re.compile(r'^\s*(?:@\w+(?:\([^)]*\))?\s*)*public\s+(?:<[^>]+>\s+)?([\w<>.\[\]]+)\s+(\w+)\s*\(([^)]*)\)(?:\s*throws\s+[\w,\s]+)?\s*\{', re.MULTILINE)
    
    for match in pattern.finditer(content):
        return_type = match.group(1)
        name = match.group(2)
        args = match.group(3)
        
        # skip if constructor (return_type has no space before name, or return_type matches class name... wait, regex group 1 is return_type, group 2 is name)
        # e.g., public TokenResponse login(LoginRequest request)
        # group 1: TokenResponse, group 2: login
        if return_type and name:
            methods.append(f"    {return_type} {name}({args});")
            
    return methods

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'public class' not in content or '@Service' not in content:
        return
        
    # Get class name
    class_match = re.search(r'public\s+class\s+(\w+)', content)
    if not class_match:
        return
        
    class_name = class_match.group(1)
    if not class_name.endswith('Service'):
        return
        
    impl_name = class_name + 'Impl'
    
    # Extract package and imports
    package_match = re.search(r'^package\s+([^;]+);', content, re.MULTILINE)
    package = package_match.group(1) if package_match else ""
    
    imports = re.findall(r'^import\s+[^;]+;', content, re.MULTILINE)
    
    methods = extract_methods(content)
    
    # Generate Interface
    interface_content = f"package {package};\n\n"
    # For simplicity, just copy all imports to the interface
    interface_content += "\n".join(imports) + "\n\n"
    interface_content += f"public interface {class_name} {{\n"
    interface_content += "\n".join(methods) + "\n"
    interface_content += "}\n"
    
    # Update Impl class
    new_content = re.sub(
        r'public\s+class\s+' + class_name,
        f'public class {impl_name} implements {class_name}',
        content
    )
    
    # Save Interface
    interface_path = filepath
    impl_path = filepath.replace(class_name + '.java', impl_name + '.java')
    
    with open(interface_path, 'w', encoding='utf-8') as f:
        f.write(interface_content)
        
    with open(impl_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Refactored {class_name} -> {impl_name}")

if __name__ == '__main__':
    base_dir = r"C:\Cinema-Manager\cinema-booking-api\src\main\java\com\cinema"
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('Service.java'):
                process_file(os.path.join(root, file))
