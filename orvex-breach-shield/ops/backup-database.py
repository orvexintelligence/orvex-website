"""Encrypted backup preparation, never run by tests. Requires pg_dump, age and
PGSERVICE/PGPASSFILE configured privately. No passwords in command arguments.
Usage: python ops/backup-database.py C:/private/backup-dir
AGE_RECIPIENT contains the operator's public age recipient, not a secret.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from datetime import datetime, timezone

def main():
    if len(sys.argv) != 2 or not os.environ.get('PGSERVICE') or not os.environ.get('AGE_RECIPIENT'):
        raise RuntimeError('Private PGSERVICE and AGE_RECIPIENT plus destination directory required')
    if not all(shutil.which(tool) for tool in ['pg_dump', 'age']):
        raise RuntimeError('Install pg_dump matching the server major and age first')
    destination = Path(sys.argv[1]).resolve()
    repository = Path(__file__).resolve().parents[2]
    if destination == repository or repository in destination.parents:
        raise RuntimeError('Backup must be outside the repository')
    destination.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
    archive = destination / ('guard-before-' + stamp + '.dump.age')
    if archive.exists():
        raise RuntimeError('Refusing to overwrite an existing backup')
    # One consistent custom archive. Direct binary pipe: no plaintext on disk,
    # no PowerShell text transcoding. Fail rather than silently exclude schemas.
    with open(os.devnull, 'wb') as errors:
        dump = subprocess.Popen(['pg_dump', '--format=custom'], stdout=subprocess.PIPE, stderr=errors)
        try:
            encryption = subprocess.run(['age', '-r', os.environ['AGE_RECIPIENT'], '-o', str(archive)], stdin=dump.stdout, stderr=errors)
        finally:
            dump.stdout.close()
        dump_status = dump.wait()
    if dump_status or encryption.returncode:
        raise RuntimeError('Backup failed; archive is incomplete. Do not apply migrations')
    with archive.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    manifest = {'archive': archive.name, 'sha256': digest, 'encrypted': True,
                'createdAt': stamp, 'restoreVerified': False,
                'scope': 'pg_dump full logical database including object ACLs; global roles, service configuration and Storage objects require separate backup'}
    archive.with_suffix('.manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print('Encrypted backup created. Restore rehearsal remains mandatory; no migration applied.')

if __name__ == '__main__':
    try:
        main()
    except Exception:
        print('Backup not verified. Check private configuration/tools; do not apply migrations.', file=sys.stderr)
        sys.exit(1)
