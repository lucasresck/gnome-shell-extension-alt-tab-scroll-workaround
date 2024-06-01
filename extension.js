// Copyright (C) 2024  Lucas Emanuel Resck
// Copyright (C) 2023  Lucas Tavares
// Copyright (C) 2023  Lucas Delobelle
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

import Clutter from "gi://Clutter";

import {
    Extension,
    InjectionManager,
} from "resource:///org/gnome/shell/extensions/extension.js";

// Reference: https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/altTab.js?ref_type=heads
import * as AltTab from "resource:///org/gnome/shell/ui/altTab.js";

import * as Overview from "resource:///org/gnome/shell/ui/overview.js";


export default class AltTabScrollWorkaroundExtension extends Extension {
    enable() {
        this._injectionManager = new InjectionManager();
        const seat = Clutter.get_default_backend().get_default_seat();
        this.vdevice = seat.create_virtual_device(
            Clutter.InputDeviceType.POINTER_DEVICE
        );

        // Fix for Alt+Tab (switch windows)
        this._injectionManager.overrideMethod(
            AltTab.WindowSwitcherPopup.prototype,
            "_finish",
            (originalMethod) => {
                let that = this;
                return function () {
                    that.movePointer();
                    originalMethod.call(this);
                };
            }
        );

        // Fix for Super+Tab (switch applications)
        this._injectionManager.overrideMethod(
            AltTab.AppSwitcherPopup.prototype,
            "_finish",
            (originalMethod) => {
                let that = this;
                return function (timestamp) {
                    if (this._currentWindow < 0) {
                        that.movePointer();
                    }
                    originalMethod.call(this, timestamp);
                };
            }
        );

        // Fix for Alt+Escape (switch windows directly)
        this._injectionManager.overrideMethod(
            AltTab.WindowCyclerPopup.prototype,
            "_finish",
            (originalMethod) => {
                let that = this;
                return function () {
                    that.movePointer();
                    originalMethod.call(this);
                };
            }
        );

        // Fix for overview (hot corner or Super key) + mouse click
        this._injectionManager.overrideMethod(
            Overview.Overview.prototype,
            '_showDone',
            (originalMethod) => {
                let that = this;
                return function () {
                    that.movePointer();
                    originalMethod.call(this);
                };
            }
        );
    }

    movePointer() {
        const [x, y] = global.get_pointer();
        this.vdevice.notify_absolute_motion(global.get_current_time(), x, y);
    }

    disable() {
        this._injectionManager.clear();
        this._injectionManager = null;
        this.vdevice = null;
    }
}
