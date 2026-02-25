-- Drop broken trigger + function (Unit DMS)
DROP TRIGGER IF EXISTS trg_create_unit_dms ON dev_project_units;
DROP FUNCTION IF EXISTS create_unit_dms_folder() CASCADE;

-- Drop conflicting trigger + function (Project DMS)
DROP TRIGGER IF EXISTS trg_create_project_dms ON dev_projects;
DROP FUNCTION IF EXISTS create_project_dms_structure() CASCADE;