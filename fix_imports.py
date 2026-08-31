import re
with open('male_uav_frontend-/src/contexts/GcsContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the broken header
broken = """import { API_URL, WS_URL } from '../config/env';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UavUnit, 
  EngineTelemetry, 
  MissionProfile, 
  InjectedFault, 
  AlertNotification,
  DemoTourStep 
} from '../types';
  MOCK_UAV_FLEET, 
  MOCK_ACTIVE_MISSION, 
  PRESET_FAULTS, 
  INITIAL_ALERTS, 
  DEMO_TOUR_STEPS 
} from '../constants';"""

fixed = """import { API_URL, WS_URL } from '../config/env';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  UavUnit, 
  EngineTelemetry, 
  MissionProfile, 
  InjectedFault, 
  AlertNotification,
  DemoTourStep 
} from '../types';
import {
  MOCK_UAV_FLEET, 
  MOCK_ACTIVE_MISSION, 
  PRESET_FAULTS, 
  INITIAL_ALERTS, 
  DEMO_TOUR_STEPS 
} from '../constants';"""

content = content.replace(broken, fixed)
with open('male_uav_frontend-/src/contexts/GcsContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
