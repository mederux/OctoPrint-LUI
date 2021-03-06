$(function () {
    function MaintenanceViewModel(parameters) {
        var self = this;

        self.flyout = parameters[0];
        self.printerState = parameters[1];
        self.settings = parameters[2];
        self.filament = parameters[3];

        self.sendJogCommand = function (axis, multiplier, distance) {
            if (typeof distance === "undefined")
                distance = $('#jog_distance button.active').data('distance');
            if (self.settings.printerProfiles.currentProfileData() && self.settings.printerProfiles.currentProfileData()["axes"] && self.settings.printerProfiles.currentProfileData()["axes"][axis] && self.settings.printerProfiles.currentProfileData()["axes"][axis]["inverted"]()) {
                multiplier *= -1;
            }

            var data = {};
            data[axis] = distance * multiplier;
            OctoPrint.printer.jog(data);
        };

        self.filamentLoadPosition = function ()  {

            var text = "You are about to move the printer to the maintenance position.";
            var question = "Do want to continue?";
            var title = "Maintenance position"
            var dialog = {'title': title, 'text': text, 'question' : question};

            self.flyout.showConfirmationFlyout(dialog, true)
                .done(function ()  {
                    self.moveToFilamentLoadPosition();

                    self.flyout.showInfo('Maintenance position', 'Press OK when you are done with the print head maintenance. This will home the printer.', false, self.afterMaintenance);
                });
        };

        self.cleanBedPosition = function ()  {

            var text = "You are about to move the printer to the clean bed position. This move will home all axis! Make sure there is no print on the bed.";
            var question = "Do want to continue?";
            var title = "Clean bed position"
            var dialog = {'title': title, 'text': text, 'question' : question};

            self.flyout.showConfirmationFlyout(dialog, true)
                .done(function(){
                    self.moveToCleanBedPosition();

                    self.flyout.showInfo('Maintenance position', 'Press OK when you are done with cleaning the bed. This will home the printer.', false, self.afterMaintenance);
                });
        };

        self.afterMaintenance = function()
        {
            OctoPrint.printer.home(['x', 'y']);
        }

        self.calibrateExtruders = function ()  {
            self.flyout.showFlyout('extrudercalibration', true);
        }

        self.calibrateBed = function()
        {
            self.flyout.showFlyout('bedcalibration', true);
        }

        self.sendHomeCommand = function (axis) {
            OctoPrint.printer.home(axis);
        };

        self._sendApi = function (data) {
            url = OctoPrint.getSimpleApiUrl('lui');
            return OctoPrint.postJson(url, data);
        };

        self.moveToCleanBedPosition = function () {
            self._sendApi({
                command: 'move_to_maintenance_position'
            }).done(function ()  {
                $.notify({ title: "Clean bed", text: "The printer is moving towards the clean bed position." }, "success");
            });
        };

        self.moveToFilamentLoadPosition = function () {
            self._sendApi({
                command: 'move_to_filament_load_position'
            }).done(function ()  {
                $.notify({ title: "Head maintenance", text: "The printhead is moving towards the maintenance position." }, "success");
                
            });
        };

        

        self.beginPurgeWizard = function (tool)
        {
            if (self.filament.getFilamentMaterial(tool) == "None")
                return;

            var text = "You are about to move the printer to the filament load position.";
            var question = "Do want to continue?";
            var title = "Purge nozzle"
            var dialog = { 'title': title, 'text': text, 'question': question };

            self.flyout.showConfirmationFlyout(dialog)
                .done(function ()  {
                    self.filament.showFilamentChangeFlyout(tool, true);
                });
        };

        self.setFilamentAmount = function () {
            self.filament.requestData();
            self.flyout.showFlyout('filament_override')
        };

        self.onSettingsShown = function () { 
            $('#maintenance_control').addClass('active');
            $('#maintenance_filament').removeClass('active');

        };

    }
    // This is how our plugin registers itself with the application, by adding some configuration
    // information to the global variable ADDITIONAL_VIEWMODELS
    ADDITIONAL_VIEWMODELS.push([
        // This is the constructor to call for instantiating the plugin
        MaintenanceViewModel,

        // This is a list of dependencies to inject into the plugin, the order which you request
        // here is the order in which the dependencies will be injected into your view model upon
        // instantiation via the parameters argument
        ["flyoutViewModel", "printerStateViewModel", "settingsViewModel", "filamentViewModel"],

        // Finally, this is the list of all elements we want this view model to be bound to.
        ["#maintenance_settings_flyout_content"]
    ]);
});
