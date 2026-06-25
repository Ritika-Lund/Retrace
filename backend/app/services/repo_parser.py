import os
import git
import tempfile
import shutil
from pathlib import Path

ALLOWED_EXTENSIONS = {
    '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c',
    '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.css', '.html',
    '.json', '.yaml', '.yml', '.md', '.env.example', '.sql'
}

MAX_FILE_SIZE = 50000

def clone_repo(repo_url: str) -> str:
    if not repo_url.startswith("https://github.com/"):
        raise ValueError("Please provide a valid GitHub repository URL (must start with https://github.com/)")
    
    import subprocess
    temp_dir = tempfile.mkdtemp()
    
    process = subprocess.Popen(
        ["git", "clone", "--depth=1", "--filter=blob:none", repo_url, temp_dir],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
    )
    try:
        stdout, stderr = process.communicate(timeout=30)
    except subprocess.TimeoutExpired:
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(process.pid)], 
                      capture_output=True) if os.name == 'nt' else process.kill()
        process.communicate()
        raise ValueError("This repository is taking too long to load. Try a smaller repository.")
    
    if process.returncode != 0:
        error_str = stderr.lower()
        if "not found" in error_str or "repository not found" in error_str:
            raise ValueError("Repository not found. Check the URL or make sure the repo is public.")
        elif "could not read username" in error_str or "authentication" in error_str:
            raise ValueError("This appears to be a private repository. Retrace only works with public repos right now.")
        else:
            raise ValueError("Could not clone this repository. Please check the URL and try again.")
    
    return temp_dir

def parse_repo(repo_url: str) -> dict:
    temp_dir = None
    try:
        temp_dir = clone_repo(repo_url)
        repo = git.Repo(temp_dir)

        
        files = {}
        file_check_count = 0
        for file_path in Path(temp_dir).rglob('*'):
            file_check_count += 1
            if file_check_count > 3000:
                raise ValueError("This repository is too large for Retrace right now. Try a smaller repo (under 3000 files).")
            if file_path.is_file():
                if any(part.startswith('.') for part in file_path.parts):
                    continue
                if any(skip in str(file_path) for skip in [
                    'node_modules', '__pycache__', '.git',
                    'venv', 'dist', 'build', '.next'
                ]):
                    continue
                if file_path.suffix in ALLOWED_EXTENSIONS:
                    try:
                        if file_path.stat().st_size < MAX_FILE_SIZE:
                            relative_path = str(file_path.relative_to(temp_dir))
                            files[relative_path] = file_path.read_text(
                                encoding='utf-8', errors='ignore'
                            )
                    except Exception:
                        continue

        commits = []
        for commit in list(repo.iter_commits())[:20]:
            commits.append({
                "hash": commit.hexsha[:7],
                "message": commit.message.strip(),
                "author": commit.author.name,
                "date": commit.committed_datetime.isoformat()
            })

        dependencies = {}
        package_json_path = os.path.join(temp_dir, 'package.json')
        requirements_path = os.path.join(temp_dir, 'requirements.txt')

        if os.path.exists(package_json_path):
            import json
            with open(package_json_path) as f:
                pkg = json.load(f)
                dependencies['npm'] = list(pkg.get('dependencies', {}).keys())

        if os.path.exists(requirements_path):
            with open(requirements_path) as f:
                dependencies['pip'] = [
                    line.strip() for line in f.readlines() if line.strip()
                ]

        return {
            "files": files,
            "commits": commits,
            "dependencies": dependencies,
            "file_count": len(files),
            "repo_url": repo_url
        }

    finally:
        if temp_dir and os.path.exists(temp_dir):
            try:
                # Windows fix - handle read-only git files
                import stat
                def remove_readonly(func, path, excinfo):
                    os.chmod(path, stat.S_IWRITE)
                    func(path)
                shutil.rmtree(temp_dir, onerror=remove_readonly)
            except Exception:
                pass