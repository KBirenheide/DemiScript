# DemiScript Documentation

The DemiScript core class can be initialized with
```js
new DemiScript();
```

# The DemiScript Class
The following arguments can be passed on initialization: canvas (string), folderpath (string), editor(bool)
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
 
  

