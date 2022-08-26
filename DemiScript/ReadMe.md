# DemiScript Documentation
Before initializing the DemiScript core class, the following javascript libraries are required:

* #### jQuery                 https://jquery.com/
* #### jQuery-ui              https://jqueryui.com/
* #### spectrum.js            https://bgrins.github.io/spectrum/
* #### fabric.js              https://github.com/fabricjs
* #### CJK-Fabric-Textbox.js  https://github.com/thuytv-scuti/fabric-CJK-vertical
* #### OpenSeadragon          https://github.com/openseadragon/openseadragon
* #### OpenSeadragonFabricjsOverlay https://github.com/altert/OpenseadragonFabricjsOverlay

For the most bug-free experience, check the OpenSeadragonFabricjsOverlay repository first to see which versions of OpenSeadragon and Fabric.js are currently compatible.

The DemiScript core class can be initialized with
```js
new DemiScript();
```
The following arguments can be passed on initialization: canvas (string), folderpath (string), editor(bool)
```js
new DemiScript(canvas, folderpath, editor);
```
Once the DemiScript class has been initialized with a corresponding canvas element id, which should be somewhere on your document, you can then load a IIIF manifest or a DemiScript manifest into the canvas. The editor parameter will be set to **true** by default, but **false** can be passed to disable editor functions.
To load a IIIF manifest into your canvas element, call the constructviewer() function. Set the first parameter to **false** to indicate that no DemiScript manifest is being passed to the function, then pass a IIIF manifest file link through the second parameter.
```js
var demiscript = new DemiScript("canvasid", "demiscript/folder/path");
demiscript.constructviewer(false, iiifmanifest);
```
To load a DemiScript manifest, load the file into an object variable and pass it through the second parameter of the constructviewer() function, while setting the first parameter to **true**.
```js
var demiscript = new DemiScript("canvasid", "demiscript/folder/path");
demiscript.constructviewer(true, demidoc);
```

The DemiScript class generates most of its editing and viewer functions. However, when calling the class, you also need to set up sliders for the white filter overlay and the viewport rotation. You can do so by implementing the following code in your JavaScript:
```js
jQuery("#rotateslider").slider({
    min: -180,
    max: 180,
    slide: function(event, ui) {
        demiscript.viewer.viewport.setRotation(ui.value);
    }
    });

jQuery( "#overlayslider" ).slider({
                step: 0.05,
                value: 0.3,
                max: 1,
                min: 0,
                orientation: "horizontal",
                slide: function( event, ui ) {

                                  jQuery( ".bleach" ).css("opacity", ui.value);

                                  if(ui.value == 0)
                                    {
                                    jQuery(".lower-canvas").hide();
                                    }
                                    else
                                    {
                                    jQuery(".lower-canvas").show();
                                    }
                                  }
                                });
```
**.bleach** is the class of the white overlay filter. If the filter should have a different color or other properties, they can be set in ../css/demiscript.css

# The DemiScript Class
## Members
* ##### canvas
  contains the canvas element id. This is the element into which the viewer is rendered.
* ##### editor
  If set to true, editor elements will be shown after loading a document. If set to false, only navigation elements are displayed.
* ##### tilesources
  This memeber stores the IIIF manifest link.
* ##### iiifmanifest
  This member stores the IIIF manifest after constructviewer() has been called.
* ##### viewer
  This member stores the OpenSeadragon viewer after constructviewer() has been called.
* ##### overlay
  This member stores the fabric.js overlay after constructviewer() has been called.
* ##### castcanvas
  This member stores the fabric.js canvas after constructviewer() has been called.
* ##### pageoverlays
  This member stores the fabric overlays for each individual page of the document after constructviewer() has been called.
* ##### page
  This member stores the active document page.
* ##### sortedobjects
  An empty array for internal processes.
* ##### advancededitor
  A switch to check if the advanced editing buttons are currently displayed.
* ##### overlaygroups
  An array of overlay groups for elements. All text elements in the "main" group are also rendered in the plaintext view.
* ##### curationfolders
  An array of all curation folders.
* ##### curationitems
  An array containing a set of arrays with the images associated with existing curation folders.
* ##### folderpath
  The path to the DemiScript installation.
* ##### overlays
  This is a legacy member, which used to store OpenSeadragon overlays.  
* ##### additionalCanvasListeners
  An array of listeners pushed in via the appendCanvasListener() function.
  
Additional members are related to internal processes, specifically the drawing of fabric shape elements and the rotation of the viewport and fabric elements.
 
## Member Functions
The following member functions can be used externally by calling them via the initialized class.

