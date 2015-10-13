# Network Monitor Script

This script allows you to automatically swap between a local IP and remote IP address based on the connectivity available to your mobile device.

It will compare the SSID when using Wi-Fi and swap to remote IP mode if the SSID does not match your chosen SSID.  
This allows you to be connected via 3G or Wi-Fi remotely, and automatically adjust connections to the correct IP address and port number.

**NOTE: It is up to you to manage your network to allow for remote connections via port forwarding or similar methods.**

## Script Usage

There are examples in `main.js` that you can follow.

  * Define your system as normal in guiDesigner, using the **local IP address**.
  * Adjust the SSID in `main.js` to reflect the name of your Wi-Fi network that you want to assign as **local**
  * Adjust `main.js` to use the correct **system name** as per the name you assigned to your system in guiDesigner.
  * Adjust the **remote IP and remote port** settings in `main.js`
  * Ensure that `networkmonitor.js` is added to your guiDesigner script manager, and is added **BEFORE** `main.js`