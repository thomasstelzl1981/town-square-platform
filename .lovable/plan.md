

# Reihenfolge der Area-Tabs aendern

Einfache Aenderung in `src/manifests/areaConfig.ts`: Die Reihenfolge des `areaConfig`-Arrays bestimmt die Tab-Reihenfolge in der Navigation.

## Aktuelle Reihenfolge
1. Client (missions)
2. Manager (operations)
3. Base (base)
4. Service (services)

## Neue Reihenfolge
1. Client (missions)
2. Manager (operations)
3. Service (services)
4. Base (base)

## Umsetzung

**Datei: `src/manifests/areaConfig.ts`**

Die beiden letzten Array-Eintraege tauschen ihre Position — `services` kommt vor `base`. Keine weiteren Dateien betroffen.

