import re

# Backend service
with open('backend-service/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old = """    yield
    logger.info("Shutting down Main Backend Service Gateway...")
    simulator_ws_client.stop()
    ws_task.cancel()"""

new = """    yield
    import traceback
    logger.info("Shutting down Main Backend Service Gateway... capturing stack trace:")
    logger.info(''.join(traceback.format_stack()))
    simulator_ws_client.stop()
    ws_task.cancel()"""

if old in content:
    content = content.replace(old, new)
    with open('backend-service/app/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched backend-service lifespan")
else:
    print("Could not find old string in backend-service lifespan")

# Simulator
with open('simulator/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_sim = """    yield
    # Cleanup logic if any"""

new_sim = """    yield
    import traceback
    print("Shutting down Simulator Service... capturing stack trace:")
    print(''.join(traceback.format_stack()))
    # Cleanup logic if any"""

if old_sim in content:
    content = content.replace(old_sim, new_sim)
    with open('simulator/main.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched simulator lifespan")
else:
    print("Could not find old string in simulator lifespan")
