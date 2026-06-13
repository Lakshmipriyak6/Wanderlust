import urllib.request
import urllib.parse
import urllib.error
import time

base = 'https://wanderlust-1qs6.onrender.com'

# Create unique username with timestamp
username = 'test' + str(int(time.time()))
data = urllib.parse.urlencode({
    'username': username,
    'email': 'test' + str(int(time.time())) + '@example.com',
    'password': 'testpass123'
}).encode()

req = urllib.request.Request(base + '/signup', data=data, method='POST')
try:
    response = urllib.request.urlopen(req, timeout=10)
    print(f'✓ Signup successful (Status: {response.status})')
except urllib.error.HTTPError as e:
    if e.code in [302, 301]:
        print(f'✓ Signup working - received redirect {e.code} (expected behavior)')
    else:
        print(f'HTTP {e.code}: {e.reason}')
except Exception as e:
    print(f'Error: {type(e).__name__}: {e}')
