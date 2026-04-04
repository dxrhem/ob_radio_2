Config = {}

Config.DefaultVolume = 0.7         -- 0.0 to 1.0
Config.MaxAudioDistance = 30.0     -- meters - beyond this, silent
Config.MuffleStartDistance = 5.0   -- meters - lowpass filter begins
Config.SlowMotionWhileOpen = false -- GTA-style slow-mo when wheel is open
Config.DisableNativeRadio = true   -- Disable GTA's built-in radio

-- Vehicles where the radio is disabled.
-- Class 18 = Emergency (police, ambulance, firetruck).
Config.DisableInEmergencyClass = true
-- Additional specific models by name. Example: {'police', 'police2', 'sheriff', 'riot'}
Config.DisabledVehicleModels = {}

Config.Stations = {
    {
        id = 'OB_RADIO_1',
        label = 'J7 Radio',
        logo = 'j7radio.png',
        songs = {
            { file = 'badhabits.ogg', title = 'Bad Habits', artist = 'KUURO', duration = 187 },
        },
    },
    {
        id = 'OB_RADIO_2',
        label = 'Sleep Token 24/7.FM',
        logo = 'sleeptoken.png',
        songs = {
            { file = 'gethsemane.ogg', title = 'Gethsemane', artist = 'Sleep Token', duration = 384 },
        },
    },
    {
        id = 'OB_RADIO_3',
        label = 'DnB Radio',
        logo = 'dnb.png',
        songs = {
            { file = 'stepaway.ogg', title = 'Step Away', artist = 'Chase & Status', duration = 248 },
        },
    },
    {
        id = 'OB_RADIO_4',
        label = '24/7 Dave.FM',
        logo = 'dave.png',
        songs = {
            { file = 'verdansk.ogg', title = 'Verdansk', artist = 'Dave', duration = 319 },
        },
    },
    {
        id = 'OB_RADIO_5',
        label = '24/7 Drinks On Me.FM',
        logo = 'drinksonme.png',
        songs = {
            { file = 'wherehaveyoubeen.ogg', title = 'Where Have You Been', artist = 'Drinks On Me', duration = 180 },
        },
    },
    {
        id = 'OB_RADIO_6',
        label = '24/7 Billie Eilish.FM',
        logo = 'billie.png',
        songs = {
            { file = 'happierthanever.ogg', title = 'Happier Than Ever', artist = 'Billie Eilish', duration = 315 },
        },
    },
}
