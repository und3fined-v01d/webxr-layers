# Development Setup: Oculus

## Table of Contents
- Developer Account Set-up
- Enabling Developer Mode for the Oculus Device
- Development Environment Setup on the OS
- Enabling Flags in the Oculus Browser
- Running a local application in the Oculus Browser
    - Network address `https://<ip>:port` 
    - Localhost address `https://localhost:8080`
- Debugging within the Oculus Browser
- Oculus Developer Hub
- Additional Resources

## Developer Account Set-up
Before getting started, you would require a Facebook account and a corresponding [Oculus Developer Account](https://developer.oculus.com/)


## Enabling Developer Mode for the Oculus Device
- Download the Oculus App and login using Facebook
- Turn on the headset
- Navigate to devices and select the device
<img src="./assests/OculusDeveloperMode.PNG" style="border: 1px solid black; height: 350px"/>
- Click on 'Developer Mode' and enable it by toggling the switch
<img src="./assests/EnableDevMode.PNG" style="border: 1px solid black"/>

## Development Environment Setup on the OS
- Connect the Oculus device to your machine via USC-C, and upon being prompted, [Enable Developer Mode](https://developer.oculus.com/documentation/native/android/mobile-device-setup/)

- Install [ADB driver](https://developer.oculus.com/downloads/package/oculus-adb-drivers/) for your OS 

__For Windows__

- Check if the ADB driver path is configured in your global path variable by using the command `echo %PATH%`

- If is it configured correctly, it should be visible such as
 <img src="./assests/ADB_AddedToPath.PNG" style="margin-left: 10px;"/>

- If you cannot see this path `C:\Users\USERNAME\AppData\Local\Android\sdk\platform-tools` present, add it your environment variables either by using the command `setx PATH "%PATH%;C:\Program Files\android-sdk-windows\platform-tools"` or manually by navigating to environment variables and ammending the environment variable: *PATH*

 <img src="./assests/ADB_PathVar.PNG" style="border: 1px solid black; margin-left: 50px; height: 300px;"/>

- To check whether your device is connected correctly, use the command `adb devices`. If all is good and the device is detected, you should see the following output:

 <img src="./assests/adbDevices.PNG" style="border: 1px solid black; margin-left: 50px;"/>

-  [Enable Wifi Debugging](https://developer.oculus.com/documentation/oculus-browser/browser-remote-debugging/)


## Enabling Flags in the Oculus Browser
In order to run a WebXR based application in the Oculus Browser, we need to establish certain flags. Navigate to `chrome://flags/` and enable the following flags:

    webxr-layers
    webxr-hands
    webxr-high-refresh-rate
    enable-webxr-foveation-rendering
    enable-webxr-ca-correction
    webxr-navigation-permission
    webxr-enforce-user-activation
    webxr-frame-rate

<img src="./assests/oculus_flags.PNG" style="border: 1px solid black"/>
<img src="./assests/oculus_flags2.PNG" style="border: 1px solid black"/>

## Running a local application in the Oculus Browser
- To run a WebXR application in the browser, HTTPs is required. Before running your application locally, ensure that OPENSSL is configured 

- Run the `webxr-layers` application using `npm run dev` in your local terminal
<img src="./assests/npmrundev.PNG" style="border: 1px solid black; margin-left:  10px"/>

- The application is now running on `https://localhost:8080` or on your network at `https://<ip>:port`

### __There are 2 ways to view the application running locally within your oculus browser, by accessing the following addresses:__


###  1. Network address `https://<ip>:port` 
Ensure that your oculus device and local machine are both connected to the same WiFi network, and that the oculus device is connected to your machine

If prompted with the *your connection is not private* screen, click on *advanced* and then *proceed to _IP:PORT_ url*. This  should redirect you to the locally running application and allow you to interact with it.

<img src="./assests/network_security.PNG" style="border: 1px solid black; height: 200px; margin-left:50px;"/>
<img src="./assests/ipaddress.PNG" style="border: 1px solid black"/> 

Additionally, if the steps so far do not result in the desired result, we might need to  by-pass the "https" requirement. For this,
- Navigate to chrome://flags on the device
- Search for `Insecure origins treated as secure`
- Then enable it and add http://192.168.1.110:8080/ in the control attached to that setting. Ensure that you have entered the correct IP and port number
<img src="./assests/insecureOrigins.PNG" style="border: 1px solid black"/> 
- Reboot the browser, and access the URL again

### 2. Localhost address `https://localhost:8080`

To be able to access the local port of your machine on the oculus browser as is, we need to perform reverse port forwarding. Essentially, anytime we access a particular port on the oculus browser - we want to forward that to our local machine. `adb` has built-in support for port forwarding.

Use the command `adb reverse tcp:PORT tcp:PORT`. Here, we want the port:8080 on the Oculus Browser to be forwarded to port:8080 on our local machine. Hence, run the command as follows:
`adb reverse tcp:8080 tcp:8080`

<img src="./assests/portforwarding.PNG" style="border: 1px solid black"/>

Now, access  `https://localhost:8080` from within the oculus browser.  Ensure that the oculus device is connected to your machine.

<img src="./assests/localhost8080.PNG" style="border: 1px solid black"/>

The application should be visible as shown above. These steps are required to be followed for each debugging session i.e. every time the device is disconnected and then re-connected

## Debugging within the Oculus Browser
To debug the application running locally and accessible via the Oculus Browser, visit `chrome://inspect/#devices` on your machine browser

Here you would be able to view all URLs currently active within the Oculus Browser

<img src="./assests/inspect.PNG" style="border: 1px solid black"/>

Click on the URL that you would like to debug

<img src="./assests/inspectIP8080.PNG" style="border: 1px solid black"/>

The developer tool and console here are in sycn with any interactions with the application within the Oculus Browser!


## Oculus Developer Hub
*For Windows*
- Download [Oculus Developer Hub](https://developer.oculus.com/downloads/package/oculus-developer-hub-win/)
- [Configure your device on ODH](https://developer.oculus.com/documentation/tools/odh/#connect-headset-to-odh)
- [Oculus Developer Hub Debugging Tools](https://developer.oculus.com/documentation/tools/odh-media/)

## Additional Resources
- [Oculus Developer Documentation](https://developer.oculus.com/develop/)
- [Oculus Browser Remote Debugging](https://developer.oculus.com/documentation/oculus-browser/browser-remote-debugging/)
- [Getting Started with Oculus Browser and Debugging](https://developer.oculus.com/webxr/)


