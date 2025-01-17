// Copyright (C) 2022  Lucas Emanuel Resck
// Copyright (C) 2022  vakokako
// Copyright (C) 2021  Taiki Sugawara

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const { Clutter, Meta, GObject } = imports.gi;
const Main = imports.ui.main;
const altTab = imports.ui.altTab;

let CurrentMonitorWindowSwitcherPopup;
let CurrentMonitorAppSwitcherPopup;
let CurrentWindowCyclerPopup;
let extension = null;

class Extension {
    constructor() {
        this.origMethods = {
            windowSwitcherPopup: altTab.WindowSwitcherPopup,
            appSwitcherPopup: altTab.AppSwitcherPopup,
            WindowCyclerPopup: altTab.WindowCyclerPopup,
        };

        altTab.WindowSwitcherPopup = CurrentMonitorWindowSwitcherPopup;
        altTab.AppSwitcherPopup = CurrentMonitorAppSwitcherPopup;
        altTab.WindowCyclerPopup = CurrentWindowCyclerPopup;

        const seat = Clutter.get_default_backend().get_default_seat();
        this.vdevice = seat.create_virtual_device(
            Clutter.InputDeviceType.POINTER_DEVICE
        );
    }

    movePointer() {
        const [x, y] = global.get_pointer();
        this.vdevice.notify_absolute_motion(global.get_current_time(), x, y);
    }

    destroy() {
        altTab.WindowSwitcherPopup = this.origMethods["windowSwitcherPopup"];
        altTab.AppSwitcherPopup = this.origMethods["appSwitcherPopup"];
    }
}

function init() {
    // Fix for Alt+Tab (switch windows)
    CurrentMonitorWindowSwitcherPopup = GObject.registerClass(
        class CurrentMonitorWindowSwitcherPopup extends altTab.WindowSwitcherPopup {
            _finish() {
                extension.movePointer();
                super._finish();
            }
        }
    );
    // Fix for Super+Tab (switch applications)
    CurrentMonitorAppSwitcherPopup = GObject.registerClass(
        class CurrentMonitorAppSwitcherPopup extends altTab.AppSwitcherPopup {
            _finish(timestamp) {
                if (this._currentWindow < 0) {
                    extension.movePointer();
                }
                super._finish(timestamp);
            }
        }
    );
    // Fix for Alt+Escape (switch windows directly)
    CurrentWindowCyclerPopup = GObject.registerClass(
        class CurrentWindowCyclerPopup extends altTab.WindowCyclerPopup {
            _finish() {
                extension.movePointer();
                super._finish();
            }
        }
    );
}

function enable() {
    extension = new Extension();
}

function disable() {
    extension.destroy();
    extension = null;
}
