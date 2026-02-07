/**
 * Widget Type Definitions for Dashboard Widget System (MOD-00)
 * 
 * Widgets are created exclusively by Armstrong and can be sorted via drag & drop.
 */

// =============================================================================
// WIDGET TYPES
// =============================================================================

export type SystemWidgetType = 
  | 'system_armstrong' 
  | 'system_weather' 
  | 'system_globe';

export type TaskWidgetType = 
  | 'letter' 
  | 'email' 
  | 'reminder' 
  | 'task' 
  | 'research' 
  | 'note' 
  | 'project' 
  | 'idea';

export type WidgetType = SystemWidgetType | TaskWidgetType;

// =============================================================================
// WIDGET STATUS
// =============================================================================

export type WidgetStatus = 
  | 'pending' 
  | 'executing' 
  | 'completed' 
  | 'cancelled';

// =============================================================================
// WIDGET INTERFACE
// =============================================================================

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  status: WidgetStatus;
  risk_level: 'low' | 'medium' | 'high';
  cost_model: 'free' | 'metered' | 'premium';
  parameters?: Record<string, unknown>;
  created_at: string;
  completed_at?: string;
  action_code?: string;
}

// =============================================================================
// WIDGET CONFIGURATION
// =============================================================================

export interface WidgetConfig {
  type: WidgetType;
  icon: string;
  label_de: string;
  gradient: string;
  deletable: boolean;
}

export const WIDGET_CONFIGS: Record<WidgetType, WidgetConfig> = {
  // System Widgets (non-deletable)
  system_armstrong: { 
    type: 'system_armstrong',
    icon: 'Sparkles', 
    label_de: 'Armstrong', 
    gradient: 'from-primary/10 to-primary/5', 
    deletable: false 
  },
  system_weather: { 
    type: 'system_weather',
    icon: 'Cloud', 
    label_de: 'Wetter', 
    gradient: 'from-blue-500/10 to-blue-600/5', 
    deletable: false 
  },
  system_globe: { 
    type: 'system_globe',
    icon: 'Globe', 
    label_de: 'Globus', 
    gradient: 'from-green-500/10 to-green-600/5', 
    deletable: false 
  },
  
  // Task Widgets (deletable)
  letter: { 
    type: 'letter',
    icon: 'Mail', 
    label_de: 'Brief', 
    gradient: 'from-blue-500/10 to-blue-600/5', 
    deletable: true 
  },
  email: { 
    type: 'email',
    icon: 'MailOpen', 
    label_de: 'E-Mail', 
    gradient: 'from-purple-500/10 to-purple-600/5', 
    deletable: true 
  },
  reminder: { 
    type: 'reminder',
    icon: 'Bell', 
    label_de: 'Erinnerung', 
    gradient: 'from-amber-500/10 to-amber-600/5', 
    deletable: true 
  },
  task: { 
    type: 'task',
    icon: 'CheckSquare', 
    label_de: 'Aufgabe', 
    gradient: 'from-green-500/10 to-emerald-600/5', 
    deletable: true 
  },
  research: { 
    type: 'research',
    icon: 'Search', 
    label_de: 'Recherche', 
    gradient: 'from-cyan-500/10 to-teal-600/5', 
    deletable: true 
  },
  note: { 
    type: 'note',
    icon: 'StickyNote', 
    label_de: 'Notiz', 
    gradient: 'from-yellow-500/10 to-amber-600/5', 
    deletable: true 
  },
  project: { 
    type: 'project',
    icon: 'FolderKanban', 
    label_de: 'Projekt', 
    gradient: 'from-indigo-500/10 to-violet-600/5', 
    deletable: true 
  },
  idea: { 
    type: 'idea',
    icon: 'Lightbulb', 
    label_de: 'Idee', 
    gradient: 'from-pink-500/10 to-rose-600/5', 
    deletable: true 
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function isSystemWidget(type: WidgetType): type is SystemWidgetType {
  return type.startsWith('system_');
}

export function isTaskWidget(type: WidgetType): type is TaskWidgetType {
  return !type.startsWith('system_');
}

export function getWidgetConfig(type: WidgetType): WidgetConfig {
  return WIDGET_CONFIGS[type];
}

// =============================================================================
// DEMO DATA (for development)
// =============================================================================

export const DEMO_TASK_WIDGETS: Widget[] = [
  {
    id: 'demo-letter-1',
    type: 'letter',
    title: 'Brief an Max Müller',
    description: 'Mieterhöhung zum 01.04.2026',
    status: 'pending',
    risk_level: 'medium',
    cost_model: 'free',
    parameters: { recipient: 'Max Müller', channel: 'email' },
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    action_code: 'ARM.MOD02.SEND_LETTER',
  },
  {
    id: 'demo-reminder-1',
    type: 'reminder',
    title: 'Vertrag prüfen',
    description: 'Mietvertrag Hauptstr. 5 endet am 31.03',
    status: 'pending',
    risk_level: 'low',
    cost_model: 'free',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    action_code: 'ARM.MOD00.CREATE_REMINDER',
  },
];
