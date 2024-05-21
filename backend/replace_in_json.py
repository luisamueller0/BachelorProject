def replace_in_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        file_contents = file.read()

    # Replace every instance of \N with \\N
    modified_contents = file_contents.replace('\\N', '\\\\N')

    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(modified_contents)

if __name__ == "__main__":
    file_path = 'artists.json'  # Replace with your file path
    replace_in_json(file_path)
    print(f"Replaced all \\N with \\\\N in {file_path}")
