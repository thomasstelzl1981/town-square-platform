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

/**
 * TASK WIDGET DESIGN SPEC:
 * - Container: aspect-square, glass-card style
 * - Header: Icon + type label + risk badge
 * - Content: Title + description (line-clamp)
 * - Footer: Meta info + TWO ROUND GLASS BUTTONS (no text labels)
 *   - Left button: X icon (cancel) - outline, hover destructive
 *   - Right button: ✓ icon (confirm) - primary tint, glass effect
 * - Button size: h-10 w-10 rounded-full
 * - Glass effect: backdrop-blur-sm, bg-background/60 or bg-primary/10
 */

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

// DEMO_TASK_WIDGETS removed — task widgets are now persisted in the task_widgets DB table.
// See useTaskWidgets hook for CRUD + Realtime.
