from flask import Flask, request, jsonify
from flask_cors import CORS
import routeros_api
import os
import mysql.connector
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# MySQL Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'mawar_isp'
}

def get_db():
    """Get MySQL database connection"""
    return mysql.connector.connect(**DB_CONFIG)

def get_mikrotik_by_id(mikrotik_id):
    """Get Mikrotik device credentials from database"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, name, ip, port, username, password FROM Mikrotik WHERE id = %s",
        (mikrotik_id,)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row

def get_mikrotik_connection(mikrotik_id):
    """Get RouterOS API connection"""
    device = get_mikrotik_by_id(mikrotik_id)
    if not device:
        return None, "Mikrotik device not found"
    
    try:
        connection = routeros_api.RouterOsApiPool(
            device['ip'],
            username=device['username'],
            password=device['password'],
            port=device['port'],
            use_ssl=False,
            ssl_verify=False,
            plaintext_login=True
        )
        api = connection.get_api()
        return api, None
    except Exception as e:
        return None, str(e)

def generate_uuid():
    return str(uuid.uuid4())

@app.route('/api/mikrotik/test-connection', methods=['POST'])
def test_connection():
    """Test Mikrotik connection"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    
    if not mikrotik_id:
        return jsonify({'success': False, 'error': 'mikrotik_id is required'})
    
    api, error = get_mikrotik_connection(mikrotik_id)
    if error:
        return jsonify({'success': False, 'error': error})
    
    try:
        identity = api.get_resource('/system/identity')
        result = identity.get()
        
        # Update status to online
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE Mikrotik SET status = 'online', lastSync = %s WHERE id = %s", 
                      (datetime.now(), mikrotik_id))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {'identity': result[0].get('name', 'Unknown') if result else 'Unknown'}
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ============ PPP PROFILES ============

@app.route('/api/mikrotik/pppoe/profiles', methods=['POST'])
def get_ppp_profiles():
    """Get PPP Profiles from database (cached)"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, routerosId, name, localAddress, remoteAddress, rateLimit FROM PPPProfile WHERE mikrotikId = %s",
        (mikrotik_id,)
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': [{
            'id': r['routerosId'],
            'name': r['name'],
            'local_address': r['localAddress'] or '',
            'remote_address': r['remoteAddress'] or '',
            'rate_limit': r['rateLimit'] or '',
        } for r in rows]
    })

@app.route('/api/mikrotik/pppoe/profiles/sync', methods=['POST'])
def sync_ppp_profiles():
    """Sync PPP Profiles from Mikrotik to database"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    
    api, error = get_mikrotik_connection(mikrotik_id)
    if error:
        return jsonify({'success': False, 'error': error})
    
    try:
        profiles = api.get_resource('/ppp/profile')
        result = profiles.get()
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Clear existing profiles for this mikrotik
        cursor.execute("DELETE FROM PPPProfile WHERE mikrotikId = %s", (mikrotik_id,))
        
        # Insert new profiles
        for p in result:
            cursor.execute("""
                INSERT INTO PPPProfile (id, mikrotikId, routerosId, name, localAddress, remoteAddress, rateLimit, createdAt, updatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                generate_uuid(),
                mikrotik_id,
                p.get('.id', ''),
                p.get('name', ''),
                p.get('local-address', ''),
                p.get('remote-address', ''),
                p.get('rate-limit', ''),
                datetime.now(),
                datetime.now()
            ))
        
        # Update lastSync
        cursor.execute("UPDATE Mikrotik SET lastSync = %s WHERE id = %s", 
                      (datetime.now(), mikrotik_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': p.get('.id'),
                'name': p.get('name'),
                'local_address': p.get('local-address', ''),
                'remote_address': p.get('remote-address', ''),
                'rate_limit': p.get('rate-limit', ''),
            } for p in result],
            'count': len(result)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

# ============ PPP SECRETS ============

@app.route('/api/mikrotik/pppoe/secrets', methods=['POST'])
def get_ppp_secrets():
    """Get PPP Secrets from database (cached)"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT id, routerosId, name, profile, localAddress, remoteAddress, comment, disabled FROM PPPSecret WHERE mikrotikId = %s",
        (mikrotik_id,)
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'data': [{
            'id': r['routerosId'],
            'name': r['name'],
            'profile': r['profile'] or 'default',
            'disabled': bool(r['disabled']),
            'local_address': r['localAddress'] or '',
            'remote_address': r['remoteAddress'] or '',
            'comment': r['comment'] or '',
        } for r in rows]
    })

@app.route('/api/mikrotik/pppoe/secrets/sync', methods=['POST'])
def sync_ppp_secrets():
    """Sync PPP Secrets from Mikrotik to database and create/update Customers"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    
    api, error = get_mikrotik_connection(mikrotik_id)
    if error:
        return jsonify({'success': False, 'error': error})
    
    try:
        secrets = api.get_resource('/ppp/secret')
        result = secrets.get()
        
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Clear existing secrets for this mikrotik
        cursor.execute("DELETE FROM PPPSecret WHERE mikrotikId = %s", (mikrotik_id,))
        
        # Get existing customers by username for this mikrotik (to avoid duplicates)
        cursor.execute("SELECT username FROM Customer WHERE mikrotikId = %s", (mikrotik_id,))
        existing_customers = {row['username'] for row in cursor.fetchall()}
        
        # Get all profiles for this mikrotik to map profile name to profileId
        cursor.execute("SELECT id, name FROM PPPProfile WHERE mikrotikId = %s", (mikrotik_id,))
        profile_map = {row['name']: row['id'] for row in cursor.fetchall()}
        
        new_customers = 0
        
        # Insert secrets and customers
        for s in result:
            secret_name = s.get('name', '')
            secret_profile = s.get('profile', 'default')
            remote_address = s.get('remote-address', '')
            disabled = s.get('disabled') == 'true'
            comment = s.get('comment', '')
            
            # Get profileId from profile_map
            profile_id = profile_map.get(secret_profile)
            
            # Insert PPP Secret
            cursor.execute("""
                INSERT INTO PPPSecret (id, mikrotikId, routerosId, name, profile, localAddress, remoteAddress, comment, disabled, createdAt, updatedAt)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                generate_uuid(),
                mikrotik_id,
                s.get('.id', ''),
                secret_name,
                secret_profile,
                s.get('local-address', ''),
                remote_address,
                comment,
                1 if disabled else 0,
                datetime.now(),
                datetime.now()
            ))
            
            # Create Customer if not exists
            if secret_name and secret_name not in existing_customers:
                cursor.execute("""
                    INSERT INTO Customer (id, name, username, mikrotikId, connectionType, profileId, servicePrice, dueDate, status, ipAddress, createdAt, updatedAt)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    generate_uuid(),
                    comment if comment else secret_name,
                    secret_name,
                    mikrotik_id,
                    'PPPOE',
                    profile_id,  # Link to profile
                    0,
                    1,
                    'ISOLIR' if disabled else 'ACTIVE',
                    remote_address,
                    datetime.now(),
                    datetime.now()
                ))
                existing_customers.add(secret_name)
                new_customers += 1
            else:
                # Update existing customer status and profile based on secret
                cursor.execute("""
                    UPDATE Customer SET status = %s, ipAddress = %s, profileId = %s, updatedAt = %s 
                    WHERE mikrotikId = %s AND username = %s
                """, (
                    'ISOLIR' if disabled else 'ACTIVE',
                    remote_address,
                    profile_id,
                    datetime.now(),
                    mikrotik_id,
                    secret_name
                ))
        
        # Update lastSync
        cursor.execute("UPDATE Mikrotik SET lastSync = %s WHERE id = %s", 
                      (datetime.now(), mikrotik_id))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': s.get('.id'),
                'name': s.get('name'),
                'profile': s.get('profile', 'default'),
                'disabled': s.get('disabled') == 'true',
                'local_address': s.get('local-address', ''),
                'remote_address': s.get('remote-address', ''),
                'comment': s.get('comment', ''),
            } for s in result],
            'count': len(result),
            'new_customers': new_customers
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/mikrotik/pppoe/secrets/disable', methods=['POST'])
def disable_ppp_secret():
    """Disable (Isolir) a PPP Secret"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    secret_name = data.get('name')
    
    if not secret_name:
        return jsonify({'success': False, 'error': 'name is required'})
    
    api, error = get_mikrotik_connection(mikrotik_id)
    if error:
        return jsonify({'success': False, 'error': error})
    
    try:
        secrets = api.get_resource('/ppp/secret')
        result = secrets.get(name=secret_name)
        if not result:
            return jsonify({'success': False, 'error': f'Secret {secret_name} not found'})
        
        secret_id = result[0].get('.id')
        secrets.set(id=secret_id, disabled='yes')
        
        # Disconnect active session
        active = api.get_resource('/ppp/active')
        active_sessions = active.get(name=secret_name)
        for session in active_sessions:
            active.remove(id=session.get('.id'))
        
        # Update database
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE PPPSecret SET disabled = 1, updatedAt = %s WHERE mikrotikId = %s AND name = %s",
                      (datetime.now(), mikrotik_id, secret_name))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': f'Secret {secret_name} disabled'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/mikrotik/pppoe/secrets/enable', methods=['POST'])
def enable_ppp_secret():
    """Enable (Aktivasi) a PPP Secret"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    secret_name = data.get('name')
    
    if not secret_name:
        return jsonify({'success': False, 'error': 'name is required'})
    
    api, error = get_mikrotik_connection(mikrotik_id)
    if error:
        return jsonify({'success': False, 'error': error})
    
    try:
        secrets = api.get_resource('/ppp/secret')
        result = secrets.get(name=secret_name)
        if not result:
            return jsonify({'success': False, 'error': f'Secret {secret_name} not found'})
        
        secret_id = result[0].get('.id')
        secrets.set(id=secret_id, disabled='no')
        
        # Update database
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE PPPSecret SET disabled = 0, updatedAt = %s WHERE mikrotikId = %s AND name = %s",
                      (datetime.now(), mikrotik_id, secret_name))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'success': True, 'message': f'Secret {secret_name} enabled'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/mikrotik/pppoe/active', methods=['POST'])
def get_active_connections():
    """Get active PPPoE connections"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    
    api, error = get_mikrotik_connection(mikrotik_id)
    if error:
        return jsonify({'success': False, 'error': error})
    
    try:
        active = api.get_resource('/ppp/active')
        result = active.get()
        return jsonify({
            'success': True,
            'data': [{
                'id': a.get('.id'),
                'name': a.get('name'),
                'service': a.get('service', 'pppoe'),
                'caller_id': a.get('caller-id', ''),
                'address': a.get('address', ''),
                'uptime': a.get('uptime', ''),
            } for a in result]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/mikrotik/system/resources', methods=['POST'])
def get_system_resources():
    """Get Mikrotik system resources (CPU, Memory, etc)"""
    data = request.get_json()
    mikrotik_id = data.get('mikrotik_id')
    
    api, error = get_mikrotik_connection(mikrotik_id)
    if error:
        return jsonify({'success': False, 'error': error})
    
    try:
        resources = api.get_resource('/system/resource')
        result = resources.get()
        if result:
            r = result[0]
            return jsonify({
                'success': True,
                'data': {
                    'uptime': r.get('uptime', ''),
                    'cpu_load': r.get('cpu-load', '0'),
                    'free_memory': r.get('free-memory', '0'),
                    'total_memory': r.get('total-memory', '0'),
                    'version': r.get('version', ''),
                    'board_name': r.get('board-name', ''),
                }
            })
        return jsonify({'success': False, 'error': 'No data'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)
