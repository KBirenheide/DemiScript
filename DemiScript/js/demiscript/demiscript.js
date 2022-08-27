class DemiScript
{
  constructor(canvas, folderprefix, editor=true)
  {
    this.canvas = canvas;
    this.editor = editor;
    this.tilesources;
    this.iiifmanifest;
    this.viewer;
    this.overlay;
    this.castcanvas;
    this.pageoverlays = [];
    this.page = 0;
    this.sortedobjects = [];
    this.advancededitor = false;
    this.overlaygroups = ["main", "pins"];
    this.curationfolders = [];
    this.curationitems = [];
    this.folderpath = folderprefix;
    this.overlays = [];
    this.additionalCanvasListeners = [];

    //Polygon Drawing Parameters
    this.isDrawing = false;
    this.startPoint = new fabric.Point(0, 0);
    this.polygonPoints = [];
    this.lines = [];

    //Overlay Rotation Parameters
    this.rotatethispoint = new fabric.Point(0, 0); // center of canvas
    this.RotateUnit = 0;
    this.rads = 0.174532925; // 10 degrees in radians

    this.rotateRight = function (ROTATE_FACTOR, newRotateUnit) {
             				            var objects = this.overlay.fabricCanvas().getObjects();
             				            for (var i in objects) {
             				                var objectOrigin = new fabric.Point(objects[i].left, objects[i].top);
             				                var new_loc = fabric.util.rotatePoint(objectOrigin, this.rotatethispoint, ROTATE_FACTOR);
             				                objects[i].top = new_loc.y;
             				                objects[i].left = new_loc.x;
             				                objects[i].angle = (newRotateUnit * 10 + objects[i].sAngle);
             				            }
             				            this.overlay.fabricCanvas().renderAll();
             				            this.RotateUnit = newRotateUnit;
             				        }

    this.rotateLeft = function (ROTATE_FACTOR, newRotateUnit) {
             				            var objects = this.overlay.fabricCanvas().getObjects();
             				            for (var i in objects) {
             				                var objectOrigin = new fabric.Point(objects[i].left, objects[i].top);
             				                var new_loc = fabric.util.rotatePoint(objectOrigin, this.rotatethispoint, ROTATE_FACTOR);
             				                objects[i].top = new_loc.y;
             				                objects[i].left = new_loc.x;
             				                objects[i].angle = (newRotateUnit * 10 + objects[i].sAngle);
             				            }
             				            this.overlay.fabricCanvas().renderAll();
             				            this.RotateUnit = newRotateUnit;
             				        }

    this.TriggerRotation = function (newRotateUnit) {
             				            if (newRotateUnit == this.RotateUnit) return;
             				            if (newRotateUnit > this.RotateUnit) {
             								//compute
             				                this.rotateRight((newRotateUnit - this.RotateUnit) * this.rads, newRotateUnit);
             				            }
             				            else {
             				                this.rotateLeft((newRotateUnit - this.RotateUnit) * this.rads, newRotateUnit);
             				            }
             				        };
  }

  //Add Canvas listeners externally
  appendCanvasListener(listener)
  {
    var demi = this;
    demi.additionalCanvasListeners.push(listener);
    demi.additionalCanvasListeners.forEach(function(listen){
      if(listen.listener == "object")
      {
        demi.castcanvas.forEachObject(function(o){
          o.on("mousedown", function(){listen.function(o);});
        });
      }
    });
  }

    //Called to asynchronously obtain the indicated IIIF-compliant JSON Manifest
    constructviewer(demifest, tilesources, callback = function(){})
    {

      if (demifest === true)
      {
        this.tilesources = tilesources.IIIFmanifest;
      }
      else
      {
        this.tilesources = tilesources;
      }

      return new Promise((resolve, reject) => {
            jQuery.getJSON(this.tilesources).then(data => {
                resolve(this.setviewer(demifest, data, tilesources));
                resolve(this.iiifmanifest = data);
                callback();
            }, error => {
              reject(console.log("failed to load tile sources"));
            });
        });

    }

    //Called to create an OpenSeadragon viewer using a IIIF-compliant JSON Manifest
    setviewer(demifest, iiifjson, demijson)
    {
      var tilesources = [];
      var demi = this;
      var mjsequence = iiifjson.sequences[0];
      var i = 0;
      var demithumb = [];

      var demi_frame = "<div id='demi_blackblock'></div>";
         demi_frame += "<div id='demi_lightbox'>";
         demi_frame += "  <div class='demi_lightinner' id='demi_thumbs'><h2>Document Pages</h2></div>";
         demi_frame += "  <div class='demi_lightinner' id='demi_showarticle'><h2>Plain Transcription</h2></div>";
         demi_frame += "  <div class='demi_lightinner' id='demi_settings'><h2>Overlay Groups and Curation</h2></div>";
         demi_frame += "<div class='btnwinemid' id='demi_closelb'>X</div></div>";
      jQuery("body").append(demi_frame);
      //jQuery("body").append("<div id='overlaycontainer' style='display: none;'></div>");

      mjsequence.canvases.forEach(canvas => {

        var mjimage = canvas.images[0].resource.service['@id'];
        var iiifmanifest = mjimage + "/info.json";

        var canvaswidth = canvas.width;
        var canvasheight = canvas.height;
        var thumbwidth = Math.round(canvaswidth / canvasheight * 250);

        var makethumb = canvas.images[0].resource['@id'].replace("full/full", "full/" + thumbwidth + ",250");
        demi.overlays.push({px: 0,py: 0,width: canvas.images[0].resource.width, height: canvas.images[0].resource.height, className: "bleach"});
        i++;

        demithumb.push({thumbid: "#pagethumb" + i, thumbnail: "<div data-pageno=\"" + i + "\" class=\"indexthumbs\" onmouseover=\"jQuery(\'#pagethumb" + i + " img\').css(\'opacity\', \'1\');\" onmouseout=\"jQuery(\'#pagethumb" + i + " img\').css(\'opacity\', \'0.7\');\" id=\"pagethumb" + i + "\" style=\"cursor: pointer; width: 200px; margin: 3px auto; position: relative;\"><img style=\"width: 100%; opacity: 0.7;\" src=\"" + makethumb + "\" /><div style=\"bottom: 3px; right: 3px; font-weight: 800; font-size: 175%; position: absolute;   text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff;\">" + i + "</div></div>"});

        tilesources.push(iiifmanifest);
        //jQuery("#overlaycontainer").append('<div id="whitesheet' + i + '" class="bleach"></div>');

      });

      this.viewer = OpenSeadragon({
    				id: this.canvas,
    				allowZoomToConstraintsOnResize: true,
    				showNavigator:  false,
    				tileSources: tilesources,
            sequenceMode: true,
    				prefixUrl: demi.folderpath + "js/openseadragon/images/",
    				maxZoomLevel: 30,
    				minZoomLevel: 0.25,
            showRotationControl: true,
            overlays: [{id: "whitesheet",
                        px: 0,
                        py: 0,
                        width: mjsequence.canvases[0].images[0].resource.width,
                        height: mjsequence.canvases[0].images[0].resource.height,
                        className: "bleach"}]
            });


          //canvas rotation handler
          demi.viewer.addHandler("rotate", function(obj)
                          {
                          demi.TriggerRotation(obj.degrees / 10);
                          jQuery("#rotateslider").slider("value", 0);
                          });

          //pageoverlayswitch
          demi.viewer.addHandler("page", function (obj)
                      		{
                            var newpage = obj.page;
                            var curpage = demi.page;
                            demi.page = obj.page;

                            demi.viewer.viewport.setRotation(0);

                            demi.pageoverlays[curpage] = demi.castcanvas.toJSON(['id','sAngle', 'lbr', 'space', 'comment', 'src', 'type', "hasControls", "hasBorders", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "editable"]);
                            var cjkdefer = [];

                            jQuery("#pagethumb" + (curpage + 1)).removeClass("activepagethumb");
                      			jQuery("#pagethumb" + (newpage + 1)).addClass("activepagethumb");

                            demi.castcanvas.clear();

                            if(typeof demi.pageoverlays[newpage] !== "undefined" && demi.pageoverlays[newpage] !== null)
                            {
                              if(demi.pageoverlays[newpage].hasOwnProperty("objects"))
                              {
                                var i = 0;

                                demi.pageoverlays[newpage].objects.forEach(function(obj) {
                                            if(obj.type == "cjk-vertical" || obj.type == "image")
                                              {
                                              cjkdefer.push(obj);
                                              demi.pageoverlays[newpage].objects[i] = null;
                                              }
                                            i++;
                                            });
                                demi.pageoverlays[newpage].objects = demi.pageoverlays[newpage].objects.filter(item => item !== null);
                                demi.castcanvas.loadFromJSON(demi.pageoverlays[newpage], demi.castcanvas.renderAll.bind(demi.castcanvas), function(o, object) {});
                              }
                              else
                              {
                                var i = 0;
                                demi.pageoverlays[newpage].forEach(function(obj) {
                                            if(obj.type == "cjk-vertical" || obj.type == "image")
                                              {
                                              cjkdefer.push(obj);
                                              demi.pageoverlays[newpage][i] = null;
                                              }
                                              i++;
                                            });
                                demi.pageoverlays[newpage].objects = demi.pageoverlays[newpage].objects.filter(item => item !== null);
                                demi.castcanvas.loadFromJSON({objects: demi.pageoverlays[newpage]}, demi.castcanvas.renderAll.bind(demi.castcanvas), function(o, object) {});
                              }

                              if(cjkdefer.length > 0)
                              {
                                demi.deserializeCJK(cjkdefer);
                              }

                              demi.castcanvas.renderAll();
                            }

                          //var location = new OpenSeadragon.Point(0,0);
                          //demi.viewer.addOverlay(demi.overlays[demi.page], location);
                          demi.viewer.overlays[0].width = mjsequence.canvases[demi.page].images[0].resource.width;
                          demi.viewer.overlays[0].height = mjsequence.canvases[demi.page].images[0].resource.height;

                          demi.demiCanvasSort();
                          });

          demithumb.forEach(function(thumbnail){
            jQuery("#demi_thumbs").append(thumbnail.thumbnail);

            jQuery(thumbnail.thumbid).on("click", function (event) {
                    var pageno = jQuery(this).attr("data-pageno");
                    demi.setdocumentpage(pageno);
                    demi.collapser();
                  });
          });
          jQuery("#pagethumb1").addClass("activepagethumb");

          // Append Editor Overlay
          var demieditor = '<div class="savebar">';

            if(demi.editor){demieditor += '<button class="btngreensingle" id="advanced" style="width: 50px; height: 50px;"><i class="material-icons md-24" style="">edit</i></button>';}

            demieditor += '<button class="btngreensingle" id="settings" style="width: 50px; height: 50px; margin-left: 2px;"><i class="material-icons md-24" style="">perm_media</i></button>';

            demieditor += '<button class="btngreensingle" id="thumbnails" style="width: 50px; height: 50px; margin-left: 2px;"><i class="material-icons md-24" style="">auto_stories</i></button>';

            demieditor += '<button class="btngreensingle" id="transcribedtext" style="width: 50px; height: 50px; margin-left: 2px;"><i class="material-icons md-24" style="">article</i></button>';

            if(demi.editor){demieditor += '<button class="btngreensingle" id="demisave" style="width: 50px; height: 50px; margin-left: 2px;"><i class="material-icons md-24" style="">save</i></button>';}

            demieditor += '</div>';

            demieditor += '<div class="addlinebar">';
            //Group Objects Button
            //demieditor += '<button class="btngreensingle" id="groupobjects"><i class="material-icons md-18" style="transform: rotate(90deg);">select_all</i></button>';
            //Ungroup Objects Button
            //demieditor += '<button class="btngreensingle" id="ungroupobjects" style="margin-left: 2px;"><i class="material-icons md-18" style="">dashboard</i></button>';

            //Line Insert
            if(demi.editor){demieditor += '<input type="text" title="Text Line" value="ニューライン" id="insertline1" onchange="" style="margin-left: 2px;"/><div style="display: inline-block;">';
            demieditor += '<button title="Insert Text, Horizontal" class="btngreenmid" id="addline" style=""><i class="material-icons md-18" style="">playlist_add</i></button>';
            demieditor += '<button title="Insert Text, Vertical" class="btngreenmid" id="addvertical" style=""><i class="material-icons md-18" style="transform: rotate(90deg);">playlist_add</i></button>';
            demieditor += '<button style="" id="cloneadd" title="Insert text, copy settings from active object." class="btngreenright"><i class="material-icons md-18" style="transform: rotate(90deg);">wrap_text</i></button></div>';

            demieditor += '<button class="btngreensingle" type="button" id="polymake" style="margin-left: 2px;"><i class="material-icons md-18" style="transform: rotate(90deg);">share</i></button>';
            demieditor += '<button class="btngreensingle" type="button" id="rectmake" style="margin-left: 2px;"><i class="material-icons md-18">rectangle</i></button>';
            demieditor += '<button class="btngreensingle" type="button" id="circmake" style="margin-left: 2px;"><i class="material-icons md-18">circle</i></button>';

            demieditor += '<button class="btngreensingle" type="button" id="imageadd" style="margin-left: 2px;"><i class="material-icons md-18">add_photo_alternate</i></button>';

            demieditor += '<button class="btngreensingle" type="button" id="curatesection" style="margin-left: 2px;"><i class="material-icons md-18">perm_media</i></button>';
            demieditor += '<button class="btngreensingle" type="button" id="extimage" style="margin-left: 2px;"><i class="material-icons md-18">content_cut</i></button>';
            demieditor += '<button class="btngreensingle" type="button" id="mappin" style="margin-left: 2px;"><i class="material-icons md-18">location_on</i></button>';

            demieditor += '<input id="colorsethidden" value="rgba(0,0,0,1)" style="max-width: 100%; display: none;"/>';
            demieditor += '</div>';}
            else {demieditor += '<input type="text" title="Text Line" value="ニューライン" id="insertline1" onchange="" style="display: none; margin-left: 2px;"/><div style="display: inline-block;">';}

          jQuery("#" + this.canvas).append(demieditor);

          jQuery("#addline").on("click", function (event) {
                  demi.addline("horizontal");
                  demi.demiCanvasSort();
                });
          jQuery("#addvertical").on("click", function (event) {
                  demi.addline("vertical");
                  demi.demiCanvasSort();
                });

          //Grouping and Ungrouping Buttons
            // jQuery("#groupobjects").on("click", function (event) {
            //         demi.demiCanvasSort();
            //         demi.initgrouping();
            //         });
            // jQuery("#ungroupobjects").on("click", function (event) {
            //         demi.ungroup();
            //         demi.demiCanvasSort();
            //         });

          //Polygon Button
          jQuery("#polymake").on("click", function (event) {
                  demi.polygon();
                  demi.demiCanvasSort();
                  });

          //Rectangle Button
          jQuery("#rectmake").on("click", function (event) {
                  demi.rectangle();
                  demi.demiCanvasSort();
                  });

          //Rectangle Button
          jQuery("#circmake").on("click", function (event) {
                  demi.circle();
                  demi.demiCanvasSort();
                  });

          //Add Image to Canvas
          jQuery("#imageadd").on("click", function (event) {
                  demi.addimage();
                  demi.demiCanvasSort();
                  });

          //Image Export Section
          jQuery("#extimage").on("click", function (event) {
                  demi.extimage();
                  });

          //Create a labled map pin at the center of the active object
          jQuery("#mappin").on("click", function (event) {
                  demi.addmappin();
                  demi.demiCanvasSort();
                  });

          //Curate Section
          jQuery("#curatesection").on("click", function (event) {
                  jQuery("#confirmdeny").remove();
                  demi.curate();
                  });

          //DemiDocSave Button
          jQuery("#demisave").on("click", function (event) {
                  demi.demiCanvasSort();
                  demi.exportdemi();
                  });

          //Show Pages Thumbnails
          jQuery("#thumbnails").on("click", function (event) {
                  demi.expander("demi_thumbs");
                  });

          //Show Curation Settings
          jQuery("#settings").on("click", function (event) {
                  demi.expander("demi_settings");
                  demi.getGroupings();
                  });

          //Close Lightbox
          jQuery("#demi_closelb").on("click", function (event) {
                  demi.collapser("demi_closelb");
                  });

          //Show Transcribed Text
          jQuery("#transcribedtext").on("click", function (event) {
                  demi.createplaintext();
                  demi.expander("demi_showarticle");
                  });

          //Show advanced edit options
          jQuery("#advanced").on("click", function (event) {
                  demi.advancededit();
                  });

          //clone active object
          jQuery("#cloneadd").on("click", function (event) {
                  demi.cloneobject();
                  demi.demiCanvasSort();
                  });

          // Initiate Fabric Overlay
          this.overlay = this.viewer.fabricjsOverlay({scale: 5000});

          this.castcanvas = this.overlay.fabricCanvas();

          //object rotation handler
          demi.castcanvas.on("object:rotating", function(obj)
                          {
                            obj.target.set("sAngle", obj.target.get("angle"));
                          });

          if(demifest === true)
          {
                          demi.pageoverlays = demijson.DemiData;

                          demi.overlaygroups = demijson.DemiOverlaygroups;
                          demi.curationfolders = demijson.DemiCurationFolders;
                          demi.curationitems = demijson.DemiCurationItems;

                          var text = new fabric.IText("", { fontSize: 0, left: 0, top: 0,  fill: "#000" });

				                      demi.castcanvas.add(text);

                          var cjkdefer = [];

                          demi.pageoverlays.forEach(function(page, index, theArray)
                            {

                            if(index === 0)
                            {
                              page.objects.forEach(function(object, i, theArray, p=index)
                                {
                                if(object.type == "cjk-vertical" || object.type == "image")
                                  {
                                  cjkdefer.push(object);

                                  demi.pageoverlays[p].objects[i] = null;
                                  }
                                });
                                var i = 0;
                                demi.pageoverlays[index].objects = demi.pageoverlays[index].objects.filter(item => item !== null);
                                demi.castcanvas.loadFromJSON(demi.pageoverlays[index], demi.castcanvas.renderAll.bind(demi.castcanvas), function(o, object) {});
                            }
                            });

                          this.castcanvas.renderAll.bind(this.castcanvas);

                          this.deserializeCJK(cjkdefer);

                          demi.castcanvas.renderAll();

                          this.createplaintext();

                        this.viewer.viewport.setRotation(0);

                        demi.demiCanvasSort();
          }

    }

    advancededit()
    {
      if(this.advancededitor === false)
      {
      var demi = this;
      var advanced = '<div id="advancededit">';
          advanced += '<div class="buttongroup">';

          advanced +=   '<button title="Delete object" class="btngreensingle" id="advanced_delete_object"><i class="material-icons md-18" >delete_sweep</i></button>';
          advanced +=   '</span><button title="Change line spacing" class="btnlableleft" style="margin-left: 2px;"><i class="material-icons md-18" >format_line_spacing</i></button><button class="btngreenmid" id="advanced_lineheight_plus"><i class="material-icons md-18" >add</i></button><button class="btngreenright" id="advanced_lineheight_minus"><i class="material-icons md-18" >remove</i></button>';

          advanced +=   '<button class="btngreensingle" id="advanced_color_change" style="margin-left: 2px;"><i class="material-icons md-18" >colorize</i></button>';
          advanced +=   '<button class="btngreensingle" id="advanced_color_set" style="margin-left: 2px;"><i class="material-icons md-18" >format_color_fill</i></button>';

          advanced +=   '<input title="" type="text" value="000000" id="colorset" style="margin-left: 2px;"/>';

          advanced +=   '<button class="btngreensingle" id="advanced_move_to_bottom" style="margin-left: 2px;"><i class="material-icons md-18" style="transform: rotate(90deg);">double_arrow</i></button>';

          advanced +=   '<button class="btngreensingle" id="advanced_object_settings" style="margin-left: 2px;"><i class="material-icons md-18">settings_applications</i></button>';

          advanced += '</div>';
          advanced += '</div>';
      jQuery(".addlinebar").append(advanced);

      jQuery("#advanced_lineheight_plus").off("click");
      var lineheightlistenerplus = jQuery("#advanced_lineheight_plus").on("click", function(event){demi.editoverlay('lineHeight', '+-', 0.05)});
      jQuery("#advanced_lineheight_minus").off("click");
      var lineheightlistenerminus = jQuery("#advanced_lineheight_minus").on("click", function(event){demi.editoverlay('lineHeight', '+-', -0.05)});
      jQuery("#advanced_delete_object").off("click");
      var advanced_deleteobject = jQuery("#advanced_delete_object").on("click", function(event){
                                                                                  jQuery("body").append("<div title='Are you sure?' id='confirmdeny'></div>");
                                                                                  jQuery("#confirmdeny").dialog({
                                                                                            dialogClass: "no-close",
                                                                                            buttons : {
                                                                                            "Delete" : function() {
                                                                                              demi.deleteobject();
                                                                                            jQuery(this).dialog("close");

                                                                                            },
                                                                                            "Cancel" : function() {
                                                                                            jQuery(this).dialog("close");

                                                                                            }
                                                                                            },
                                                                                            close: function() {jQuery("#confirmdeny").remove();}
                                                                                            });

                                                                                    });
      jQuery("#advanced_move_to_bottom").off("click");
      var advanced_movetobottom = jQuery("#advanced_move_to_bottom").on("click", function(event){demi.movetobottom()});
      jQuery("#advanced_color_change").off("click");
      var advanced_colorchange = jQuery("#advanced_color_change").on("click", function(event){
                                                                                              jQuery("#colorset").spectrum("destroy");
                                                                                              jQuery("#colorset").spectrum({
                                                                                              color: demi.castcanvas.getActiveObject().get("fill"),
                                                                                              showAlpha: true
                                                                                                });
                                                                                              jQuery("#colorsethidden").val(demi.castcanvas.getActiveObject().get("fill"));
                                                                                              });
      jQuery("#colorset").spectrum({
                            color: "rgba(0,0,0,1)",
                          	showAlpha: true
                          });

      jQuery("#advanced_color_set").off("click");
      var advanced_colorpicker1 = jQuery("#advanced_color_set").on("click", function (e) {
                                  demi.editoverlay('fill', 'set', jQuery('#colorsethidden').val());
                                });

      jQuery("#colorset").off("change");
      var advanced_colorpicker2 = jQuery("#colorset").on('change', function (e, tinycolor) {
                                  jQuery("#colorset").val(tinycolor.toRgbString());
                                  jQuery("#colorsethidden").val(tinycolor.toRgbString());
                                  demi.editoverlay('fill', 'set', jQuery('#colorset').val());
                                  });

      jQuery("#advanced_object_settings").off("click");
      var advanced_objectsettings = jQuery("#advanced_object_settings").on('click', function(event) {
                                            if(demi.castcanvas.getActiveObject())
                                            {
                                            var target = demi.castcanvas.getActiveObject();
                                            var fields = "<div id='objectproperties'><table><tbody>";
                                            //struck properties:
                                            var validkeys = ["text", "id", "textAlign", "fill", "textBackgroundColor", "lineHeight", "sAngle", "fontWeight", "opacity", "overlaysection", "stroke", "strokeWidth", "comment", "left", "top", "originX", "originY", "skewX", "skewY", "scaleX", "scaleY"];
                                            var addos = true;
                                            Object.entries(target).forEach(([key, value]) => {
                                                  if(validkeys.indexOf(key) != -1)
                                                  {
                                                    if(key == "overlaysection")
                                                    {
                                                    fields += "<tr><td>" + key + ": </td><td><select data-key='" + key + "'>";
                                                      demi.overlaygroups.forEach(overlay => {
                                                        fields += "<option value='" + overlay + "'>";
                                                        fields += overlay;
                                                        fields += "</option>";
                                                      });
                                                    fields += "</td></tr>";
                                                    addos = false;
                                                    }
                                                    else
                                                    {
                                                    fields += "<tr><td>" + key + ": </td><td><input data-key='" + key + "'" + "value='" + value + "'/></td></tr>";
                                                    }
                                                  }

                                                });
                                            if(addos)
                                            {
                                              fields += "<tr><td>overlaysection: </td><td><select data-key='overlaysection'>";
                                                demi.overlaygroups.forEach(overlay => {
                                                  fields += "<option value='" + overlay + "'>";
                                                  fields += overlay;
                                                  fields += "</option>";
                                                });
                                              fields += "</td></tr>";
                                            }
                                            fields += "</tbody></table></div>";

                                            jQuery("body").append("<div title='Object Settings' id='confirmdeny'>" + fields + "</div>");
                                            jQuery("#objectproperties > table > tbody > tr > td > select[data-key='overlaysection']").val(target.get("overlaysection"));
                                            jQuery("#confirmdeny").dialog({
                                                      dialogClass: "no-close",
                                                      buttons : {
                                                      "Apply" : function() {
                                                      jQuery("#objectproperties > table > tbody > tr > td > input").each( function(){
                                                        if(jQuery( this ).val() !== "null" && jQuery( this ).val() !== "undefined" && jQuery( this ).val() !== null && jQuery( this ).val() !== undefined)
                                                        {var targetO = demi.castcanvas.getActiveObject();
                                                          var key = jQuery( this ).attr("data-key");
                                                          var value = jQuery( this ).val().replace(/['"]+/g, '');
                                                          if (isNaN(value) !== true) value = Number.parseFloat(value);
                                                        targetO.set(key, value);}
                                                      });
                                                      jQuery("#objectproperties > table > tbody > tr > td > select").each( function(){
                                                        if(jQuery( this ).val() !== "null" && jQuery( this ).val() !== "undefined" && jQuery( this ).val() !== null && jQuery( this ).val() !== undefined)
                                                        {var targetO = demi.castcanvas.getActiveObject();
                                                          var key = jQuery( this ).attr("data-key");
                                                          var value = jQuery( this ).val();
                                                        targetO.set(key, value);
                                                        }
                                                      });
                                                      demi.castcanvas.renderAll();
                                                      jQuery(this).dialog("close");

                                                      },
                                                      "Cancel" : function() {
                                                      jQuery(this).dialog("close");

                                                      }
                                                      },
                                                      close: function() {jQuery("#confirmdeny").remove();}
                                                      });
                                              }
                                            });

      this.advancededitor = true;
      }
      else
      {
      jQuery("#advancededit").remove();
      this.advancededitor = false;
      }

    }

    //Add image
    addimage()
    {
      var demi = this;
      var url = jQuery("#insertline1").val();
      var newImg = new Image();
      newImg.onload = function (img) {
        var loadimg = new fabric.Image(newImg, {
        left: 0,
        top: 0,
            });
            demi.castcanvas.add(loadimg);
          };
        newImg.src = url;
      	this.castcanvas.renderAll();

    }

    //Delete active object
    deleteobject()
    {
      var target = this.castcanvas.getActiveObject();
      this.castcanvas.remove(target);
      this.castcanvas.renderAll();
    }

    //Move object to bottom in rendering order
    movetobottom()
    {
      var demi = this;
      var target = this.castcanvas.getActiveObject();
      var bottomid = this.castcanvas._objects[0].id;
      demi.castcanvas.forEachObject(function(obj)
                          {
                            obj.set("id", (obj.get("id") + 1));
                          });
      target.set("id", bottomid);
      demi.demiCanvasSort();
      demi.castcanvas.discardActiveObject().renderAll();
    }

    cloneobject()
    {
      var target = this.castcanvas.getActiveObject();
      if(target.type == "cjk-vertical")
      {
        this.addline("vertical", "#insertline1", target.left + target.getScaledWidth(), target.top, "left", "top", target.fontSize, target.textBackgroundColor, target.lbr, target.space, target.scaleX, target.scaleY, target.fill);
      }
      if(target.type == "i-text")
      {
        this.addline("horizontal", "#insertline1", target.left + target.getScaledWidth(), target.top, "left", "top", target.fontSize, target.textBackgroundColor, target.lbr, target.space, target.scaleX, target.scaleY, target.fill);
      }
      this.castcanvas.renderAll();
    }

    //Edit properties of active overlay object
    editoverlay(property, operation, value)
    {
      var target = this.castcanvas.getActiveObject();

      if(operation == "+-")
      {
        target.set(property, (target.get(property) + value));
        this.castcanvas.renderAll();
      }
      if(operation == "set")
      {
        target.set(property, (value));
        this.castcanvas.renderAll();
      }

    }

    deserializeCJK(cjkdefer)
    {
      var demi = this;

      cjkdefer.forEach(function(object){

        if(object.type == "cjk-vertical")
        {

        jQuery("#insertline1").val(object.text);
        demi.addline("vertical", "#insertline1");
        jQuery("#insertline1").val("ニューライン");

        var newline;

        var gather = [];

        demi.castcanvas.forEachObject(function(obj)
                            {
                              gather.push(obj);
                            });

        newline = gather[(gather.length - 1)];
        var validkeys = ["text", "id", "textAlign", "fill", "textBackgroundColor", "lineHeight", "sAngle", "fontWeight", "opacity", "overlaysection", "stroke", "strokeWidth", "comment", "left", "top", "originX", "originY", "skewX", "skewY", "scaleX", "scaleY", "hasControls", "hasBorders", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "editable"];

        Object.entries(object).forEach(([key, value]) => {
          if(validkeys.indexOf(key) != -1)
          {
            if (isNaN(value) !== true && value !== true && value !== false) value = Number.parseFloat(value);
            newline.set(key, value);
          }
        });

        // var cjk = new CJKTextbox(object.text, {type: "cjk-vertical", id: object.id, display: object.display, fontSize: object.fontSize, left: object.left, top: object.top, originX: object.originX, originY: object.originY, fill: object.fill, textBackgroundColor: object.textBackgroundColor, lineHeight: object.lineHeight, angle: object.angle, sAngle: object.sAngle, fontWeight: object.fontWeight, opacity: object.opacity, skewX: object.skewX, skewY: object.skewY, scaleX: object.scaleX, scaleY: object.scaleY, overlaysection: object.overlaysection, lbr: object.lbr, space: object.space, comment: object.comment, stroke: object.stroke, strokeWidth: object.strokeWidth});
        // demi.castcanvas.add(cjk);
        // cjk.setCoords();
        }
      });

      cjkdefer.forEach(function(object){
        if(object.type == "image")
        {

        var newimg;

        var gather = [];

        var addimg = new fabric.Image();
        demi.castcanvas.add(addimg);

        demi.castcanvas.forEachObject(function(obj)
                            {
                              gather.push(obj);
                            });

        newimg = gather[(gather.length - 1)];
        newimg.setSrc(object.src);

        var validkeys = ["text", "id", "textAlign", "fill", "textBackgroundColor", "lineHeight", "sAngle", "fontWeight", "opacity", "overlaysection", "stroke", "strokeWidth", "comment", "left", "top", "originX", "originY", "skewX", "skewY", "scaleX", "scaleY", "hasControls", "hasBorders", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "editable"];

        Object.entries(object).forEach(([key, value]) => {
          if(validkeys.indexOf(key) != -1)
          {
            if (isNaN(value) !== true && value !== true && value !== false) value = Number.parseFloat(value);
            if (value == "true") value = true;
            if (value == "false") value = false;
            newimg.set(key, value);
          }
        });

        // var cjk = new CJKTextbox(object.text, {type: "cjk-vertical", id: object.id, display: object.display, fontSize: object.fontSize, left: object.left, top: object.top, originX: object.originX, originY: object.originY, fill: object.fill, textBackgroundColor: object.textBackgroundColor, lineHeight: object.lineHeight, angle: object.angle, sAngle: object.sAngle, fontWeight: object.fontWeight, opacity: object.opacity, skewX: object.skewX, skewY: object.skewY, scaleX: object.scaleX, scaleY: object.scaleY, overlaysection: object.overlaysection, lbr: object.lbr, space: object.space, comment: object.comment, stroke: object.stroke, strokeWidth: object.strokeWidth});
        // demi.castcanvas.add(cjk);
        // cjk.setCoords();
        }
      });

      demi.castcanvas.renderAll.bind(demi.castcanvas);
      demi.castcanvas.renderAll();
      demi.createplaintext();
    }

    //Lightbox Up
    expander(contents)
    {
      jQuery("#demi_blackblock").show();
      jQuery("#demi_lightbox").show("slow");
      jQuery(".demi_lightinner").hide();
      jQuery("#" + contents).show();
    }

    //Lightbox Down
    collapser()
    {
      jQuery(".folderactive").removeClass("folderactive");
      jQuery("#demi_blackblock").hide();
      jQuery("#demi_lightbox").hide("slow");
      jQuery(".demi_lightinner").hide();
    }

    //set viewer rotation to 0
    unrotatecanvas()
    {
      this.viewer.viewport.setRotation(0);
    }

    //sort Objects
    demiCanvasSort()
    {
      var demi = this;

      demi.castcanvas._objects.sort((a, b) => a.id - b.id);

      demi.castcanvas.renderAll();
    }

    //Populate with overlay groups and curation folders
    getGroupings()
    {
      var demi = this;
      var i;
      if(demi.editor){
      jQuery("#demi_settings").html("<h2>Overlay Groups and Curation</h2>");
      }
      else
      {
      jQuery("#demi_settings").html("<h2>Curation</h2>");
      }

      if (this.overlaygroups.length > 0 && demi.editor == true)
      {
        jQuery("#demi_settings").append("<hr/><h3><b>Overlay Groups</b></h3>");
        jQuery("#demi_settings").append("<input id='overlaygroupadder' value='new overlay group' style='font-size: 20px;' /><button id='overlaygroupadderbtn' class='btngreenright' style='font-weight: bold; font-size: 22px; padding: 0; min-width: 20px;'>+</button><br/><br/>");
        i = 0;
        demi.overlaygroups.forEach((e) => {
            var overlaybtn = "<button style='margin-left: 2px; cursor: default; padding: 0; padding-left: 5px; padding-right: 5px;' class='btnlableleft'>" + e + "</button>";
            if(demi.editor){overlaybtn += "<button style='padding: 0; padding-left: 5px; padding-right: 5px;' class='btngreenright removeoverlaybtn' data-id='" + i + "'>🗑</button>";}
            jQuery("#demi_settings").append(overlaybtn);
            i++;
        });
      }
      else
      {
        if(demi.editor){jQuery("#demi_settings").append("<hr/><h3><b>Overlay Groups</b></h3>");
        jQuery("#demi_settings").append("<input id='overlaygroupadder' value='new overlay group' style='font-size: 20px;' /><button id='overlaygroupadderbtn' class='btngreenright' style='font-weight: bold; font-size: 22px; padding: 0; min-width: 20px;'>+</button><br/><br/>");}
      }

      if (this.curationfolders.length > 0)
      {
        jQuery("#demi_settings").append("<hr/><h3><b>Curated Images</b></h3>");
        if(demi.editor){jQuery("#demi_settings").append("<input id='curationfolderadder' value='new curation folder' style='font-size: 20px;' /><button id='curationfolderadderbtn' class='btngreenright' style='font-weight: bold; font-size: 22px; padding: 0; min-width: 20px;'>+</button><br/><br/>");}
        i = 0;
        var collection = "";
        demi.curationfolders.forEach((e) => {
          var folderbtn = "<div style='max-width: 150px; padding: 8px; float: left; text-align: center;' ><div class='curationfolder' data-id='" + i + "'>📁</div><br><span>" + e + "</span>";
          if(demi.editor){folderbtn += "<button style='padding: 0; padding-left: 5px; padding-right: 5px; margin-left: 4px;' class='btngreensingle removefolderbtn' data-id='" + i + "'>🗑</button>";}
            jQuery("#demi_settings").append(folderbtn + "</div>");
            collection = "";
            if(demi.curationitems[i])
              {
                var k = 0;
                demi.curationitems[i].forEach((image) => {
                collection += "<div style='float: left; width: 150px; height: 150px; margin-left: 2px; overflow: auto; position: relative;'><div style='max-width: 100%; position: absolute; bottom: 0; text-align: center;'>";
                collection += "<img src='" + image.src + "' style='cursor: pointer; border: 1px solid black; max-width: 150px; max-height: 120px;' onclick='window.open(\"" + image.src + "\", \"_blank\");'/><div style='clear: both;'></div>";
                if(demi.editor){collection += "<input value='" + image.title + "' style='max-width: calc(100% - 70px);' class='imgtitleinput' data-id='" + k + "' data-parentid='" + i + "'/><button data-left='" + image.bounds.left + "' data-top='" + image.bounds.top + "' data-width='" + image.bounds.width + "' data-height='" + image.bounds.height + "' data-page='" + image.page + "'class='btngreensingle gotocurimg' style='padding: 0; max-height: 22px; max-width: 25px; margin-left: 2px;'>⬋</button>";
                collection += "<button class='btngreensingle trashimg' data-id='" + k + "' data-parentid='" + i + "' style='padding: 0; max-height: 22px; max-width: 25px; margin-left: 2px;'>🗑</button>";}
                else{collection += "<span style='max-width: calc(100% - 70px);' class='imgtitleinput' data-id='" + k + "' data-parentid='" + i + "'>" + image.title + "</span><button data-left='" + image.bounds.left + "' data-top='" + image.bounds.top + "' data-width='" + image.bounds.width + "' data-height='" + image.bounds.height + "' data-page='" + image.page + "'class='btngreensingle gotocurimg' style='padding: 0; max-height: 22px; max-width: 25px; margin-left: 2px;'>⬋</button>"}
                collection += "</div></div>";
                k++;
                });
              }
            jQuery("#demi_settings").append("<div style='width: 200px; min-width: 100%;' id='folder" + i + "' data-id='" + i + "' class='curationcontainer'>" + collection + "<div style='clear: both;'></div></div>");
            i++;
        });
        jQuery(".curationcontainer").hide();
      }
      else
      {
        if(demi.editor){jQuery("#demi_settings").append("<hr/><h3><b>Curated Images</b></h3>");
        jQuery("#demi_settings").append("<input id='curationfolderadder' value='new curation folder' style='font-size: 20px;' /><button id='curationfolderadderbtn' class='btngreenright' style='font-weight: bold; font-size: 22px; padding: 0; min-width: 20px;'>+</button><br/><br/>");}
      }

      jQuery("#overlaygroupadderbtn").off("click");
      var addoverlaygroup   = jQuery("#overlaygroupadderbtn").on("click", function(event){
                                                                                  var unique = true;
                                                                                    demi.overlaygroups.forEach((e) => {
                                                                                      if(e == jQuery("#overlaygroupadder").val())
                                                                                      {
                                                                                        unique = false;
                                                                                      }
                                                                                    });
                                                                                  if(unique == true)
                                                                                    {
                                                                                      demi.overlaygroups.push(jQuery("#overlaygroupadder").val());
                                                                                      demi.getGroupings();
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                    alert("This overlay group already exists.");
                                                                                    }
                                                                                });
      jQuery("#curationfolderadderbtn").off("click");
      var addcurationfolder = jQuery("#curationfolderadderbtn").on("click", function(event){
                                                                                  var unique = true;
                                                                                    demi.curationfolders.forEach((e) => {
                                                                                      if(e == jQuery("#curationfolderadder").val())
                                                                                      {
                                                                                        unique = false;
                                                                                      }
                                                                                    });
                                                                                  if(unique == true)
                                                                                    {
                                                                                      demi.curationfolders.push(jQuery("#curationfolderadder").val());
                                                                                      demi.getGroupings();
                                                                                    }
                                                                                    else
                                                                                    {
                                                                                    alert("This curation folder already exists.");
                                                                                    }
                                                                                });
      jQuery("#removeoverlaybtn").off("click");
      var removeoverlaygroup = jQuery(".removeoverlaybtn").on("click", function(event){
                                                                                      var overlayid = jQuery( this ).attr("data-id");
                                                                                      jQuery("body").append("<div title='Are you sure?' id='confirmdeny'></div>");
                                                                                      jQuery("#confirmdeny").dialog({
                                                                                                dialogClass: "no-close",
                                                                                                buttons : {
                                                                                                "Delete" : function() {
                                                                                                  demi.overlaygroups[overlayid] = null;
                                                                                                  demi.overlaygroups = demi.overlaygroups.filter(item => item !== null);
                                                                                                  demi.getGroupings();
                                                                                                jQuery(this).dialog("close");

                                                                                                },
                                                                                                "Cancel" : function() {
                                                                                                jQuery(this).dialog("close");

                                                                                                }
                                                                                                },
                                                                                                close: function() {jQuery("#confirmdeny").remove();}
                                                                                                });

                                                                                      });
      jQuery("#removefolderbtn").off("click");
      var removecurationfolder = jQuery(".removefolderbtn").on("click", function(event){
                                                                            var folderid = jQuery( this ).attr("data-id");
                                                                            jQuery("body").append("<div title='Are you sure?' id='confirmdeny'></div>");
                                                                            jQuery("#confirmdeny").dialog({
                                                                                        dialogClass: "no-close",
                                                                                        buttons : {
                                                                                        "Delete" : function() {
                                                                                          demi.curationfolders[folderid] = null;
                                                                                          demi.curationfolders = demi.curationfolders.filter(item => item !== null);
                                                                                          demi.curationitems[folderid] = null;
                                                                                          demi.curationitems = demi.curationitems.filter(item => item !== null);
                                                                                          demi.getGroupings();
                                                                                        jQuery(this).dialog("close");

                                                                                        },
                                                                                        "Cancel" : function() {
                                                                                        jQuery(this).dialog("close");

                                                                                        }
                                                                                        },
                                                                                        close: function() {jQuery("#confirmdeny").remove();}
                                                                                        });

                                                                                      });
      jQuery("#curationfolder").off("click");
      var togglefoldercontent = jQuery(".curationfolder").on("click", function(event){
                                                                var folder = jQuery( this ).attr("data-id");
                                                                jQuery( this ).toggleClass("folderactive");
                                                                jQuery("#folder" + folder).toggle("slow");

                                                              });

      jQuery("#imgtitleinput").off("change");
      var changeimgtitle = jQuery(".imgtitleinput").on("change", function(event){
                                                              var imgid = jQuery( this ).attr("data-id");
                                                              var folderid = jQuery( this ).attr("data-parentid");
                                                              var title = jQuery( this ).val();
                                                              demi.curationitems[folderid][imgid].title = title;
                                                              });

      jQuery(".gotocurimg").off("click");
      var gotocuratedimage = jQuery(".gotocurimg").on("click", function(event){
                                                               var boundsleft = jQuery( this ).attr("data-left");
                                                               var boundstop = jQuery( this ).attr("data-top");
                                                               var boundswidth = jQuery( this ).attr("data-width");
                                                               var boundsheight = jQuery( this ).attr("data-height");
                                                               var page = jQuery( this ).attr("data-page");
                                                               demi.gotoelement("rect", [boundsleft, boundstop, boundswidth, boundsheight, page]);
                                                               demi.collapser();
                                                               });
      jQuery(".trashimg").off("click");
      var gotocuratedimage = jQuery(".trashimg").on("click", function(event){
                                                               var imgid = jQuery( this ).attr("data-id");
                                                               var folderid = jQuery( this ).attr("data-parentid");
                                                               jQuery("body").append("<div title='Are you sure?' id='confirmdeny'></div>");
                                                               jQuery("#confirmdeny").dialog({
                                                                           dialogClass: "no-close",
                                                                           buttons : {
                                                                           "Delete" : function() {
                                                                             demi.curationitems[folderid][imgid] = null;
                                                                             demi.curationitems[folderid] = demi.curationitems[folderid].filter(item => item !== null);
                                                                             demi.getGroupings();
                                                                           jQuery(this).dialog("close");

                                                                           },
                                                                           "Cancel" : function() {
                                                                           jQuery(this).dialog("close");

                                                                           }
                                                                           },
                                                                           close: function() {jQuery("#confirmdeny").remove();}
                                                                           });
                                                               });
    }

    //Create workable Plain Text from text and itext elements

    createplaintext()
    {
    var demi = this;

    var demi_showarticle_header = "<h2 style='display: inline-block;'>Plain Transcription</h2>";
       demi_showarticle_header +=  "<button class='btngreensingle' id='exportplaintext' style='display: inline-block; padding: 5px; font-weight: bold; font-size: 14pt;'><i class='material-icons md-18' >download</i></button>";
       if(demi.editor){demi_showarticle_header +=  "<div>";
       demi_showarticle_header +=  "<button class='btngreensingle' id='plaintext_id_down' style='padding-top: 0px; font-weight: bold; font-size: 14pt;'>←</button>";
       demi_showarticle_header +=  "<button class='btngreensingle' id='plaintext_id_up' style='padding-top: 0px; font-weight: bold; font-size: 14pt;'>→</button>";
       demi_showarticle_header +=  "<span style='width: 10px;'> </span>";
       demi_showarticle_header +=  "<button class='btngreenleft unticked' id='togglebreak' style='padding-top: 0px; font-weight: bold; font-size: 14pt;'><span class='unticked'>☐</span><span class='ticked'>✔</span></button>";
       demi_showarticle_header +=  "<button class='btnlableright' id='togglebreak_icon' style='padding-top: 0px; font-weight: bold; font-size: 14pt;'>\\n</button>";
       demi_showarticle_header +=  "<span style='width: 10px;'> </span>";
       demi_showarticle_header +=  "<button class='btngreenleft unticked' id='togglespace' style='padding-top: 0px; font-weight: bold; font-size: 14pt;'><span class='unticked'>☐</span><span class='ticked'>✔</span></button>";
       demi_showarticle_header +=  "<button class='btnlableright' id='togglespace_icon' style='padding-top: 0px; font-weight: bold; font-size: 14pt;'>␣</button>";
       demi_showarticle_header +=  "</div>";}

    jQuery("#demi_showarticle").html(demi_showarticle_header);

    this.sortedobjects = [];
    var demi = this;
    var fullplain = "";

    this.castcanvas.forEachObject(function(obj) {
                  if (obj.hasOwnProperty("text"))
                  {
                    demi.sortedobjects.push(obj);
                  }
                });

                demi.sortedobjects.sort((a, b) => {
                    return a.id - b.id;
                });

                demi.sortedobjects.forEach((e) => {
                  if(e.overlaysection == "main")
                  {
                    if(e.lbr === true)
                    {
                      jQuery("#demi_showarticle").append("<br/>");
                      fullplain += "\n";
                    }
                    if(e.space === true)
                    {
                      jQuery("#demi_showarticle").append("<span> </span>");
                      fullplain += " ";
                    }

                    jQuery("#demi_showarticle").append("<span class='plaintextobject' id='" + e.id + "'>" + e.text + "</span>");
                    fullplain += e.text;
                  }

                });

                //Select Plaintext Object
                jQuery(".plaintextobject").off("click");
                var plaintextobjectlistener = jQuery(".plaintextobject").on("click", function (event) {
                        jQuery("span.plaintextobject").removeClass("active");
                        jQuery(this).addClass("active");

                        demi.sortedobjects.forEach((obj) => {
                                      if (obj.id == jQuery("span.plaintextobject.active").attr("id"))
                                      {
                                        if (obj.lbr === true)
                                        {
                                          jQuery("#togglebreak").removeClass("unticked");
                                          jQuery("#togglebreak").addClass("ticked");
                                        }
                                        else
                                        {
                                          jQuery("#togglebreak").removeClass("ticked");
                                          jQuery("#togglebreak").addClass("unticked");
                                        }
                                        if (obj.space === true)
                                        {
                                          jQuery("#togglespace").removeClass("unticked");
                                          jQuery("#togglespace").addClass("ticked");
                                        }
                                        else
                                        {
                                          jQuery("#togglespace").removeClass("ticked");
                                          jQuery("#togglespace").addClass("unticked");
                                        }
                                      }
                                    });
                        });
                jQuery("#plaintext_id_down").off("click");
                var plaintextiddown = jQuery("#plaintext_id_down").on("click", function (event) {
                        var cashedprevobj;
                        demi.sortedobjects.forEach((obj) => {
                                      if (obj.id == jQuery("span.plaintextobject.active").attr("id"))
                                      {
                                        var lowerid = cashedprevobj.id;
                                        cashedprevobj.set("id", obj.id);
                                        obj.set("id", lowerid);
                                      }
                                      cashedprevobj = obj;
                                    });
                        demi.createplaintext();
                        });
                jQuery("#plaintext_id_up").off("click");
                var plaintextidup = jQuery("#plaintext_id_up").on("click", function (event) {
                        var cashedprevobj;
                        var pin = false;
                        var done = false;
                        demi.sortedobjects.forEach((obj) => {
                                  if(done == false)
                                  {
                                      if(pin == true)
                                      {
                                        var lowerid = cashedprevobj.id;
                                        cashedprevobj.set("id", obj.id);
                                        obj.set("id", lowerid);
                                        done = true;
                                      }
                                      if (obj.id == jQuery("span.plaintextobject.active").attr("id"))
                                      {
                                        cashedprevobj = obj;
                                        pin = true;
                                      }
                                    }
                                    });
                        demi.createplaintext();
                        });

                jQuery("#togglebreak").off("click");
                var togglebreak = jQuery("#togglebreak").on("click", function (event) {
                        demi.sortedobjects.forEach((obj) => {
                                              if(obj.id == jQuery("span.plaintextobject.active").attr("id"))
                                              {
                                                if (obj.lbr === true)
                                                {
                                                  jQuery("#togglebreak").removeClass("ticked");
                                                  jQuery("#togglebreak").addClass("unticked");
                                                  obj.set("lbr", false);
                                                }
                                                else
                                                {
                                                  jQuery("#togglebreak").removeClass("unticked");
                                                  jQuery("#togglebreak").addClass("ticked");
                                                  obj.set("lbr", true);
                                                }
                                              }
                                            });
                                demi.createplaintext();
                                });

                  jQuery("#togglespace").off("click");
                  var togglespace = jQuery("#togglespace").on("click", function (event) {
                                demi.sortedobjects.forEach((obj) => {
                                                      if(obj.id == jQuery("span.plaintextobject.active").attr("id"))
                                                      {
                                                        if (obj.space === true)
                                                        {
                                                          jQuery("#togglespace").removeClass("ticked");
                                                          jQuery("#togglespace").addClass("unticked");
                                                          obj.set("space", false);
                                                        }
                                                        else
                                                        {
                                                          jQuery("#togglespace").removeClass("unticked");
                                                          jQuery("#togglespace").addClass("ticked");
                                                          obj.set("space", true);
                                                        }
                                                      }
                                                    });
                                        demi.createplaintext();
                                        });

                  jQuery("#exportplaintext").off("click");
                  var togglespace = jQuery("#exportplaintext").on("click", function (event) {
                                              var file = new Blob([fullplain], {type: 'application/txt'});

                                                    var a = document.createElement("a")
                                                    var url = URL.createObjectURL(file);
                                                    a.href = url;
                                                    a.download = "page_" + demi.page + "_plaintext.txt";
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    setTimeout(() => {
                                                        document.body.removeChild(a);
                                                        window.URL.revokeObjectURL(url);
                                                    }, 0);

                                        });


    }

    //Change to different page on IIIF-Document and load corresponding overlay.
    setdocumentpage(pageno)
    {
      var demi = this;
      pageno--;
      demi.viewer.goToPage(pageno);
    }

    //Insert a Text Line
    addline(direction = "horizontal", linesource="#insertline1", setleft=0, settop=0, originX = "left", originY = "top", fontsize=120, textBackgroundColor = "rgba(0,0,0,0)", lbr = false, space = false, scaleX = 1, scaleY = 1, overlaysection = "main")
    {
        this.viewer.viewport.setRotation(0);
        var toadd = jQuery(linesource).val();
        var fill = jQuery("#colorsethidden").val();

        if(direction !== "horizontal")
        {
            var arrayOfLines = this.fold(toadd, 1);
            var toadd = arrayOfLines.join("\n");
            toadd = toadd.replace(/[\r\n]+/gm, "");

            var jpunctUNI = /[\u3000-\u303f\u30fc]/g;

            if (toadd.match(jpunctUNI))
            {
            toadd = toadd.replace(jpunctUNI, function(match) {return "[jsplit]" + match + "[jsplit]";});
            var cluster = toadd.split("[jsplit]");
            cluster = cluster.filter(e => e);
            var spacer = settop;
            var demi = this;
            var rotation = 0;
            var newgroup = [];

            cluster.forEach(function (splittext){

              if (splittext.match(jpunctUNI))
              {
                rotation = -90;
              }
              else
              {
                rotation = 0;
              }

              var objects = demi.castcanvas.getObjects();
              if(objects.length === 0 || objects.length === undefined)
              {
                var text = new CJKTextbox(splittext, {id: demi.assignnewid(), pairing: demi.assignnewid(), break: true, tei: "notag", teisub: "notag", furigana: "", display: true, fontSize: fontsize, left: setleft, top: spacer, originX: originX, originY: originY, fill: "rgba(0,0,0,1)", textBackgroundColor: textBackgroundColor, lineHeight: 1.13, angle: rotation, sAngle: rotation, fontWeight: "normal", opacity: 1, skewX: 0, skewY: 0, overlaysection: overlaysection, lbr: false, space: false, scaleX: scaleX, scaleY: scaleY, fill: fill, comment: "", stroke: "black", strokeWidth: 0});
                demi.castcanvas.add(text);
                objects = demi.castcanvas.getObjects();
                newgroup.push(objects[0]);
                if (rotation == -90)
                {
                  objects[0].set("top", (objects[0].get("top") + objects[0].getScaledWidth()));
                }
                spacer += objects[0].getScaledHeight();

              }
              else
              {
                var text = new CJKTextbox(splittext, {id: demi.assignnewid(), pairing: demi.assignnewid(), break: true, tei: "notag", teisub: "notag", furigana: "", display: true, fontSize: fontsize, left: setleft, top: spacer, originX: originX, originY: originY, fill: "rgba(0,0,0,1)", textBackgroundColor: textBackgroundColor, lineHeight: 1.13, angle: rotation, sAngle: rotation, fontWeight: "normal", opacity: 1, skewX: 0, skewY: 0, overlaysection: overlaysection, lbr: false, space: false, scaleX: scaleX, scaleY: scaleY, fill: fill, comment: "", stroke: "black", strokeWidth: 0});
                demi.castcanvas.add(text);
                objects = demi.castcanvas.getObjects();
                newgroup.push(objects[(objects.length - 1)]);
                if (rotation == -90)
                {
                  objects[(objects.length - 1)].set("top", (objects[(objects.length - 1)].get("top") + objects[(objects.length - 1)].getScaledWidth()));
                }
                spacer += objects[(objects.length - 1)].getScaledHeight();

              }
            });

            }
            else
            {
              var text = new CJKTextbox(toadd, {type: "cjk-vertical", id: this.assignnewid(), pairing: this.assignnewid(), break: true, tei: "notag", teisub: "notag", furigana: "", display: true, fontSize: fontsize, left: setleft, top: settop, originX: originX, originY: originY, fill: "rgba(0,0,0,1)", textBackgroundColor: textBackgroundColor, lineHeight: 1.13, angle: 0, sAngle: 0, fontWeight: "normal", opacity: 1, skewX: 0, skewY: 0, overlaysection: overlaysection, lbr: lbr, space: space, scaleX: scaleX, scaleY: scaleY, fill: fill, comment: "", stroke: "black", strokeWidth: 0});
              this.castcanvas.add(text);
            }
        this.castcanvas.renderAll();

        this.createplaintext();
        }
        else
        {
        toadd = toadd.replace(/{br}/g, "\\n");
        var text = new fabric.IText(toadd, {id: this.assignnewid(), pairing: this.assignnewid(), break: true, tei: "notag", teisub: "notag", furigana: "", display: true, fontSize: fontsize, left: setleft, top: settop, originX: originX, originY: originY, angle: 0, sAngle: 0, fill: "rgba(0,0,0,1)", textBackgroundColor: textBackgroundColor, lineHeight: 1.13, fontWeight: "normal", opacity: 1, skewX: 0, skewY: 0, overlaysection: overlaysection, lbr: lbr, space: space, scaleX: scaleX, scaleY: scaleY, fill: fill, comment: "", stroke: "black", strokeWidth: 0});
        this.castcanvas.add(text);

        this.castcanvas.renderAll();

        this.createplaintext();

        return text;
        }

    }

    //jump to element on a page
    gotoelement(method, data)
    {
      var demi = this;

        if(method == "rect")
        {
          var goto = demi.viewer.addOnceHandler("open", function(){
          var page = demi.iiifmanifest.sequences[0].canvases[(data[4])];
          var setx = Math.round((parseFloat(data[1]) + parseFloat((0.5 * data[3])))*1000)/1000;
          var sety = Math.round((parseFloat(data[0]) + parseFloat((0.5 * data[2])))*1000)/1000;


          //var zoom = Math.sqrt((Math.round(parseFloat(page.width)) / Math.round(parseFloat(data[2])) + Math.round(parseFloat(page.height)) / Math.round(parseFloat(data[3]))) / 2);
          var factorizer = Math.min(((Math.round(parseFloat(page.width)) / (Math.round(parseFloat(demi.viewer.viewport.getContainerSize().x)))) / (page.width / 5000)), ((Math.round(parseFloat(page.height)) / Math.round(parseFloat(demi.viewer.viewport.getContainerSize().y)) ) / (page.height / 5000)) );
          var zoom = (Math.min((Math.round(parseFloat(demi.viewer.viewport.getContainerSize().x)) / Math.round(parseFloat(data[2]))), (Math.round(parseFloat(demi.viewer.viewport.getContainerSize().y)) / Math.round(parseFloat(data[3]))))) * factorizer;

          var coords = new OpenSeadragon.Point(sety, setx);

                				coords.x = coords.x * (page.width / 5000);
                				coords.y = coords.y * (page.width / 5000);
                					demi.viewer.viewport.panTo(demi.viewer.viewport.imageToViewportCoordinates(coords));
                					demi.viewer.viewport.zoomTo(zoom);
                					demi.castcanvas.renderAll();
                        });
        }
        demi.setdocumentpage((parseInt(data[4]) + parseInt(1)));
    }

    //Initiate Object Grouping Mode
          // initgrouping()
          // {
          //   this.viewer.viewport.setRotation(0);
          //   var rect, isDownRect, origX, origY;
          //   var completerect = false;
          //   var demi = this;
          //
      		// 		demi.viewer.zoomPerClick = 1;
          //
          //     var recthandler = function(o)
          //       {
          //         if (!completerect)
          //         {
          //           isDownRect = true;
          //
          //             var pointer = demi.castcanvas.getPointer(o.e);
          //             origX = pointer.x;
          //             origY = pointer.y;
          //             rect = new fabric.Rect({
          //               left: origX,
          //               top: origY,
          //               originX: "left",
          //               originY: "top",
          //               width: pointer.x-origX,
          //               height: pointer.y-origY,
          //               angle: 0,
          //               sAngle: 0,
          //               fill: "rgba(0,150,255,0.4)",
          //               strokeWidth: 1,
        	// 							stroke: "rgba(0,0,0,0.7)",
          //               transparentCorners: false,
          //               id: demi.assignnewid(),
          //               pairing:"",
          //               break:"",
          //               tei:"",
          //               teisub:"",
          //               furigana:"",
          //               display:"",
          //               comment:"",
          //               section:"",
          //               de_de:"",
          //               en:"",
          //               overlaysection:""
          //             });
          //             completerect = true;
          //
          //             demi.castcanvas.add(rect);
          //
          //         }
          //         else
          //         {
          //             var newgroup = [];
          //             rect.setCoords();
          //             demi.castcanvas.forEachObject(function(obj) {
          //                           if (obj === rect) return;
          //                           if(rect.intersectsWithObject(obj))
          //                           {
          //                             newgroup.push(obj);
          //                           }
          //                         });
          //
          //               if (newgroup.length > 0)
          //               {
          //                 demi.castcanvas.discardActiveObject();
          //                   var sel = new fabric.ActiveSelection(newgroup, {
          //                     canvas:   demi.castcanvas,
          //                       });
          //                 demi.castcanvas.setActiveObject(sel);
          //                 demi.castcanvas.getActiveObject().toGroup();
          //               }
          //
          //             demi.castcanvas.remove(rect);
          //             completerect = false;
          //             isDownRect = false;
          //             demi.castcanvas.off("mouse:down", recthandler);
          //             demi.castcanvas.off("mouse:down", rectsizer);
          //             demi.viewer.zoomPerClick = 2;
          //
          //         }
          //       };
          //
          //       demi.castcanvas.on("mouse:down", recthandler);
          //
          //       var rectsizer = function(o)
          //       {
          //         if (!isDownRect) return;
          //
          //         var pointer = demi.castcanvas.getPointer(o.e);
          //
          //         if(origX>pointer.x){
          //           rect.set({ left: pointer.x });
          //         }
          //         if(origY>pointer.y){
          //           rect.set({ top: pointer.y });
          //         }
          //
          //         rect.set({ width: Math.abs(origX - pointer.x) });
          //         rect.set({ height: Math.abs(origY - pointer.y) });
          //
          //         demi.castcanvas.renderAll();
          //       };
          //
          //       demi.castcanvas.on("mouse:move", rectsizer);
          //
          // }

    //create Rectangle
    rectangle()
    {
      this.viewer.viewport.setRotation(0);
      var rect, isDownRect, origX, origY;
      var completerect = false;
      var demi = this;

				demi.viewer.zoomPerClick = 1;

        var recthandler = function(o)
          {
            if (!completerect)
            {
              isDownRect = true;

                var pointer = demi.castcanvas.getPointer(o.e);
                origX = pointer.x;
                origY = pointer.y;
                rect = new fabric.Rect({
                  left: origX,
                  top: origY,
                  originX: "left",
                  originY: "top",
                  width: pointer.x-origX,
                  height: pointer.y-origY,
                  angle: 0,
                  sAngle: 0,
                  fill: jQuery("#colorsethidden").val(),
                  strokeWidth: 1,
  								stroke: "rgba(0,0,0,0.7)",
                  transparentCorners: false,
                  id: demi.assignnewid(),
                  comment:"",
                  overlaysection:""
                });
                completerect = true;

                demi.castcanvas.add(rect);

            }
            else
            {
                var newgroup = [];
                rect.setCoords();
                completerect = false;
                isDownRect = false;
                demi.castcanvas.off("mouse:down", recthandler);
                demi.castcanvas.off("mouse:down", rectsizer);
                demi.viewer.zoomPerClick = 2;

            }
          };

          demi.castcanvas.on("mouse:down", recthandler);

          var rectsizer = function(o)
          {
            if (!isDownRect) return;

            var pointer = demi.castcanvas.getPointer(o.e);

            if(origX>pointer.x){
              rect.set({ left: pointer.x });
            }
            if(origY>pointer.y){
              rect.set({ top: pointer.y });
            }

            rect.set({ width: Math.abs(origX - pointer.x) });
            rect.set({ height: Math.abs(origY - pointer.y) });

            demi.castcanvas.renderAll();
          };

          demi.castcanvas.on("mouse:move", rectsizer);
    }

    //create Circle
    circle()
    {
      this.viewer.viewport.setRotation(0);
      var circle, isDownRect, origX, origY;
      var completerect = false;
      var demi = this;

        demi.viewer.zoomPerClick = 1;

        var recthandler = function(o)
          {
            if (!completerect)
            {
              isDownRect = true;

                var pointer = demi.castcanvas.getPointer(o.e);
                origX = pointer.x;
                origY = pointer.y;
                circle = new fabric.Circle({
                  left: origX,
                  top: origY,
                  originX: "left",
                  originY: "top",
                  radius: pointer.x-origX,
                  angle: 0,
                  sAngle: 0,
                  fill: jQuery("#colorsethidden").val(),
                  strokeWidth: 1,
                  stroke: "rgba(0,0,0,0.7)",
                  transparentCorners: false,
                  id: demi.assignnewid(),
                  comment:"",
                  overlaysection:""
                });
                completerect = true;

                demi.castcanvas.add(circle);

            }
            else
            {
                var newgroup = [];
                circle.setCoords();
                completerect = false;
                isDownRect = false;
                demi.castcanvas.off("mouse:down", recthandler);
                demi.castcanvas.off("mouse:down", rectsizer);
                demi.viewer.zoomPerClick = 2;

            }
          };

          demi.castcanvas.on("mouse:down", recthandler);

          var rectsizer = function(o)
          {
            if (!isDownRect) return;

            var pointer = demi.castcanvas.getPointer(o.e);

            if(origX>pointer.x){
              circle.set({ left: pointer.x });
            }
            if(origY>pointer.y){
              circle.set({ top: pointer.y });
            }

            var radius = Math.max(Math.abs(origY - pointer.y),Math.abs(origX - pointer.x))/2;
            if (radius > circle.strokeWidth) {
                radius -= circle.strokeWidth/2;
            }
            circle.set({ radius: radius});

            demi.castcanvas.renderAll();
          };

          demi.castcanvas.on("mouse:move", rectsizer);
    }

    curate()
    {
      this.viewer.viewport.setRotation(0);
      var rect, isDownRect, origX, origY;
      var completerect = false;
      var demi = this;

        demi.viewer.zoomPerClick = 1;

        var recthandler = function(o)
          {
            if (!completerect)
            {
              isDownRect = true;

                var pointer = demi.castcanvas.getPointer(o.e);
                origX = pointer.x;
                origY = pointer.y;
                rect = new fabric.Rect({
                  left: origX,
                  top: origY,
                  originX: "left",
                  originY: "top",
                  width: pointer.x-origX,
                  height: pointer.y-origY,
                  angle: 0,
                  sAngle: 0,
                  fill: "rgba(0,150,255,0.2)",
                  strokeWidth: 1,
                  stroke: "rgba(0,0,0,0.7)",
                  transparentCorners: false,
                  id: demi.assignnewid(),
                  comment:"",
                  overlaysection:""
                });
                completerect = true;

                demi.castcanvas.add(rect);

            }
            else
            {
                var newgroup = [];
                rect.setCoords();

                if (demi.curationfolders.length > 0)
                {

                var iiifdata = demi.iiifmanifest.sequences[0].canvases[demi.page];

                var sectioncoords = Math.round(rect.get("left") *(iiifdata.width / 5000)) + "," + Math.round(rect.get("top") *(iiifdata.width / 5000)) + "," + Math.round(rect.get("width") *(iiifdata.width / 5000) * rect.get("scaleX")) + "," + Math.round(rect.get("height") *(iiifdata.width / 5000) * rect.get("scaleY"));
                var pagedimensions = demi.iiifmanifest.sequences[0].canvases[demi.page].width + "," + demi.iiifmanifest.sequences[0].canvases[demi.page].height;

            		var cursrc = demi.iiifmanifest.sequences[0].canvases[demi.page].images[0].resource.service['@id'] + "/" + sectioncoords + "/" + pagedimensions + "/0/default.jpg";

                jQuery("body").append("<div id='loader'></div>");

                function imageExists(url) {return new Promise(resolve => {
                      var img = new Image();
                      img.addEventListener('load', () => resolve(true));
                      img.addEventListener('error', () => resolve(false));
                      img.src = url;
                    })}

                    imageExists(cursrc).then(ok => {
                      if(ok === false)
                      {
                        cursrc = demi.iiifmanifest.sequences[0].canvases[demi.page].images[0].resource.service['@id'] + "/" + sectioncoords + "/full/0/default.jpg";
                        executecuration();
                      }
                      else{executecuration();}
                      } );

                 function executecuration(){
                   jQuery("#loader").remove();
                   jQuery("body").append("<div title='Curate to Folder' id='confirmdeny'></div>");
                   jQuery("#confirmdeny").append("<input id='setcurationtitle' value='Enter image title' /><br><span>Click to select folders:</span><br><div id='curationfolders'></div>");
                   var i = 0;
                   demi.curationfolders.forEach((e) => {
                       jQuery("#curationfolders").append("<div style='max-width: 150px; padding: 8px; float: left; text-align: center;' ><div class='curationfolder' data-id='" + i + "'>📁</div><br><span>" + e + "</span></div>");
                       i++;
                   });
                 jQuery(".curationfolder").off("click");
                 jQuery(".curationfolder").on("click", function(event){
                                                                       jQuery( this ).toggleClass("folderactive");
                                                                       });

                 jQuery("#confirmdeny").dialog({
                             dialogClass: "no-close",
                             buttons : {
                               "Add to folder(s)" : function() {
                               var title = jQuery("#setcurationtitle").val();
                               jQuery(".curationfolder.folderactive").each(function(index, element){
                                                       if(!demi.curationitems[jQuery( element ).attr("data-id")])
                                                       {
                                                         demi.curationitems[jQuery( element ).attr("data-id")] = [];
                                                       }
                                                     demi.curationitems[jQuery( element ).attr("data-id")].push({src: cursrc,title: title,page: parseInt(demi.page), bounds: {left: rect.left, top: rect.top, width: rect.width, height: rect.height}});

                                                     });
                               jQuery(this).dialog("close");
                               },
                               "Cancel" : function() {
                               jQuery(this).dialog("close");
                               }
                             },
                             close: function() {jQuery("#confirmdeny").remove();}
                             });

                  }



                }
                else
                {
                  jQuery("body").append("<div title='Warning' id='confirmdeny'>You have no curation folders attached to the current document.</div>");
                  jQuery("#confirmdeny").dialog({
                  dialogClass: "no-close",
                  buttons : {
                  "OK" : function() {
                  jQuery(this).dialog("close");
                  }
                  },
                  close: function() {jQuery("#confirmdeny").remove();}
                  });
                }

                demi.castcanvas.remove(rect);
                completerect = false;
                isDownRect = false;
                demi.castcanvas.off("mouse:down", recthandler);
                demi.castcanvas.off("mouse:down", rectsizer);
                demi.viewer.zoomPerClick = 2;

            }
          };

          demi.castcanvas.on("mouse:down", recthandler);

          var rectsizer = function(o)
          {
            if (!isDownRect) return;

            var pointer = demi.castcanvas.getPointer(o.e);

            if(origX>pointer.x){
              rect.set({ left: pointer.x });
            }
            if(origY>pointer.y){
              rect.set({ top: pointer.y });
            }

            rect.set({ width: Math.abs(origX - pointer.x) });
            rect.set({ height: Math.abs(origY - pointer.y) });

            demi.castcanvas.renderAll();
          };

          demi.castcanvas.on("mouse:move", rectsizer);

    }

    //Export Image Section
    extimage()
    {
            this.viewer.viewport.setRotation(0);
            var rect, isDownRect, origX, origY;
            var completerect = false;
            var demi = this;

              demi.viewer.zoomPerClick = 1;

              var recthandler = function(o)
                {
                  if (!completerect)
                  {
                    isDownRect = true;

                      var pointer = demi.castcanvas.getPointer(o.e);
                      origX = pointer.x;
                      origY = pointer.y;
                      rect = new fabric.Rect({
                        left: origX,
                        top: origY,
                        originX: "left",
                        originY: "top",
                        width: pointer.x-origX,
                        height: pointer.y-origY,
                        angle: 0,
                        sAngle: 0,
                        fill: "rgba(0,150,255,0.2)",
                        strokeWidth: 1,
                        stroke: "rgba(0,0,0,0.7)",
                        transparentCorners: false,
                        id: demi.assignnewid(),
                        comment:"",
                        overlaysection:""
                      });
                      completerect = true;

                      demi.castcanvas.add(rect);

                  }
                  else
                  {
                      var newgroup = [];
                      rect.setCoords();

                      var iiifdata = demi.iiifmanifest.sequences[0].canvases[demi.page];

                      var sectioncoords = Math.round(rect.get("left") *(iiifdata.width / 5000)) + "," + Math.round(rect.get("top") *(iiifdata.width / 5000)) + "," + Math.round(rect.get("width") *(iiifdata.width / 5000) * rect.get("scaleX")) + "," + Math.round(rect.get("height") *(iiifdata.width / 5000) * rect.get("scaleY"));
                      var pagedimensions = demi.iiifmanifest.sequences[0].canvases[demi.page].width + "," + demi.iiifmanifest.sequences[0].canvases[demi.page].height;

                  		var cursrc = demi.iiifmanifest.sequences[0].canvases[demi.page].images[0].resource.service['@id'] + "/" + sectioncoords + "/" + pagedimensions + "/0/default.jpg";

                      demi.castcanvas.remove(rect);
                      completerect = false;
                      isDownRect = false;
                      demi.castcanvas.off("mouse:down", recthandler);
                      demi.castcanvas.off("mouse:down", rectsizer);
                      demi.viewer.zoomPerClick = 2;

                      jQuery("body").append("<div id='loader'></div>");

                      function imageExists(url) {return new Promise(resolve => {
                            var img = new Image();
                            img.addEventListener('load', () => resolve(true));
                            img.addEventListener('error', () => resolve(false));
                            img.src = url;
                          })}

                          imageExists(cursrc).then(ok => {
                            if(ok === false)
                            {
                              cursrc = demi.iiifmanifest.sequences[0].canvases[demi.page].images[0].resource.service['@id'] + "/" + sectioncoords + "/full/0/default.jpg";
                              executecuration();
                            }
                            else{executecuration();}
                            } );

                       function executecuration(){
                      jQuery("#loader").remove();
                      jQuery("body").append("<div title='Image Segment' id='confirmdeny'><a target='_blank' href='" + cursrc + "'>" + cursrc + "</a></div>");

                      jQuery("#confirmdeny").dialog({
                                dialogClass: "no-close",
                                buttons : {
                                  "Open Image" : function() {
                                    window.open(cursrc, "_blank");
                                  jQuery(this).dialog("close");
                                  }
                                },
                                close: function() {jQuery("#confirmdeny").remove();}
                                });


                        }
                  }
                };

                demi.castcanvas.on("mouse:down", recthandler);

                var rectsizer = function(o)
                {
                  if (!isDownRect) return;

                  var pointer = demi.castcanvas.getPointer(o.e);

                  if(origX>pointer.x){
                    rect.set({ left: pointer.x });
                  }
                  if(origY>pointer.y){
                    rect.set({ top: pointer.y });
                  }

                  rect.set({ width: Math.abs(origX - pointer.x) });
                  rect.set({ height: Math.abs(origY - pointer.y) });

                  demi.castcanvas.renderAll();
                };

                demi.castcanvas.on("mouse:move", rectsizer);

    }

    //Add map pin
    addmappin()
    {
      var demi = this;

      if(demi.castcanvas.getActiveObject())
      {
      var target = demi.castcanvas.getActiveObject();
      demi.viewer.viewport.setRotation(0);

      var imgPin = "http://demiscript.de/images/mappinbasicred.png";
      fabric.Image.fromURL(imgPin, function(oImg) {
          oImg.set({left: target.get("left") + (target.getScaledWidth() / 2),
            type: "image",
            top: target.get("top") + (target.getScaledHeight() / 2),
            originX: "left",
            originY: "bottom",
            angle: 0,
            sAngle: 0,
            fill: "",
            strokeWidth: 0,
            stroke: "",
            id: demi.assignnewid(),
            comment:"",
            overlaysection:""});
          demi.castcanvas.add(oImg);



          demi.addline("horizontal", "#insertline1", oImg.get("left")+oImg.get("width"), oImg.get("top")-oImg.get("height")+24, "left", "bottom", 24, "rgba(255,255,255,0.7)", true, false, 1, 1, "pins");

        });
      }

    }

    //Ungroup active selection
    // ungroup()
    //     {
    //       if (!this.castcanvas.getActiveObject()) {
    //       return;
    //       }
    //       if (this.castcanvas.getActiveObject().type !== 'group') {
    //         return;
    //       }
    //       this.castcanvas.getActiveObject().toActiveSelection();
    //       this.castcanvas.requestRenderAll();
    //     }

    //Assign a new object id, following the newest one
    assignnewid()
    {
              var objectnumber = this.castcanvas.size();
              objectnumber = objectnumber + 1;
              this.castcanvas.forEachObject(function(obj)
                                  {
                                    if (obj.get("id") == "")
                                    {
                                      obj.set("id", objectnumber);
                                      objectnumber = objectnumber + 1;
                                    }
                                  });

              return objectnumber;
      }

    fold(input, lineSize, lineArray)
    {
			lineArray = lineArray || [];
			if (input.length <= lineSize) {
				lineArray.push(input);
				return lineArray;
			}
			lineArray.push(input.substring(0, lineSize));
			var tail = input.substring(lineSize);
			return this.fold(tail, lineSize, lineArray);
		}

    //Create Polygon
    polygon()
    {
      var demi = this;

        if (demi.isDrawing == true)
        {
        demi.finalizepolygon();
        demi.viewer.zoomPerClick = 2;
        }
        else
        {
        demi.isDrawing = true;
        demi.viewer.zoomPerClick = 1;
        demi.viewer.viewport.setRotation(0);
        }

        demi.castcanvas.on("mouse:dblclick", function ()
				{
				  if (demi.isDrawing) {
					demi.finalizepolygon();
				  }
				});

        demi.castcanvas.on("mouse:keyup", function (evt)
				{
				  if (evt.which === 13 && demi.isDrawing) {
					demi.finalizepolygon();
          }
        });

        demi.castcanvas.on("mouse:down", function (evt)
				{
				  if (demi.isDrawing) {
					var _mouse = this.getPointer(evt.e);
					var _x = _mouse.x;
					var _y = _mouse.y;
					var line = new fabric.Line([_x, _y, _x, _y], {
					  strokeWidth: 1,
					  selectable: false,
					  stroke: "red"
					});

					demi.polygonPoints.push(new fabric.Point(_x, _y));
					demi.lines.push(line);

					this.add(line);
					this.selection = false;
				  }

				});

				demi.castcanvas.on("mouse:move", function (evt)
				{
				  if (demi.lines.length && demi.isDrawing) {
					var _mouse = this.getPointer(evt.e);
					demi.lines[demi.lines.length-1].set({
					  x2: _mouse.x,
					  y2: _mouse.y
					}).setCoords();
					this.renderAll();
				  }
				});

    }

    //Auxiliary Polygon Functions
    finalizepolygon()
    {
    var demi = this;

    demi.isDrawing = false;

      demi.lines.forEach(function (line) {
      demi.overlay.fabricCanvas().remove(line);
      });

      demi.overlay.fabricCanvas().add(demi.makePolygon()).renderAll();
      demi.lines.length = 0;
      demi.polygonPoints.length = 0;
      if(demi.overlay.fabricCanvas().getActiveObject()){demi.overlay.fabricCanvas().getActiveObject().trigger("deselected");}
      demi.overlay.fabricCanvas().renderAll();
      demi.viewer.zoomPerClick = 2;

    }

    makePolygon()
    {
    var demi = this;

      var left = fabric.util.array.min(demi.polygonPoints, "x");
      var top = fabric.util.array.min(demi.polygonPoints, "y");

      demi.polygonPoints.push(new fabric.Point(demi.polygonPoints[0].x, demi.polygonPoints[0].y));

      return new fabric.Polygon(demi.polygonPoints.slice(), {
      left: left,
      top: top,
      fill: "rgba(255,0,0,0.5)",
      stroke: "black",
      strokeWidth: 1,
      selectable: true,
      id: demi.assignnewid(),
      pairing:"",
      angle: 0,
      sAngle: 0,
      comment:"",
      overlaysection:""
      });
    }

    exportdemi()
    {
      this.viewer.viewport.setRotation(0);
      this.pageoverlays[this.page] = this.castcanvas.toJSON(['id','sAngle', 'lbr', 'space', 'comment', 'src', 'type', "hasControls", "hasBorders", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "editable"]);

      var demi = this;

      var exp = [];
      var cjkdefer = [];
      var cjkrestore = [];

      demi.pageoverlays = demi.pageoverlays.filter(item => item !== null);

      demi.pageoverlays.forEach(function(page, index, theArray) {

        demi.castcanvas.clear();

        if(page.hasOwnProperty("objects"))
        {
          var i = 0;
          demi.pageoverlays[index].objects.forEach(function(obj) {
                      if(obj.type == "cjk-vertical" || obj.type == "image")
                        {
                        cjkdefer.push(obj);
                        if(index == demi.page)
                        {
                          cjkrestore.push(obj);
                        }
                        demi.pageoverlays[index].objects[i] = null;
                        }
                      i++;
                      });
          demi.pageoverlays[index].objects = demi.pageoverlays[index].objects.filter(item => item !== null);
          demi.castcanvas.loadFromJSON(demi.pageoverlays[index], demi.castcanvas.renderAll.bind(demi.castcanvas), function(o, object) {});
          cjkdefer.forEach(function(obj) {demi.pageoverlays[index].objects.push(obj)});
          demi.castcanvas.renderAll();
        }
        else
        {
          var i = 0;
          demi.pageoverlays[index].forEach(function(obj) {
                      if(obj.type == "cjk-vertical" || obj.type == "image")
                        {
                        cjkdefer.push(obj);

                        if(index == demi.page)
                        {
                          cjkrestore.push(obj);
                        }
                        demi.pageoverlays[index][i] = null;
                        }
                        i++;
                      });
          demi.pageoverlays[index].objects = demi.pageoverlays[index].objects.filter(item => item !== null);
          demi.castcanvas.loadFromJSON({objects: demi.pageoverlays[index]}, demi.castcanvas.renderAll.bind(demi.castcanvas), function(o, object) {});
          cjkdefer.forEach(function(obj) {demi.pageoverlays[index].objects.push(obj)});
          demi.castcanvas.renderAll();
        }

        if(cjkdefer.length > 0)
        {
          demi.deserializeCJK(cjkdefer);
          cjkdefer = [];
        }

        demi.castcanvas.renderAll();

        exp[index] = demi.castcanvas.toJSON(['id','sAngle', 'lbr', 'space', 'comment', 'src', 'type', "hasControls", "hasBorders", "lockMovementX", "lockMovementY", "lockScalingX", "lockScalingY", "lockRotation", "editable"]);



        demi.castcanvas.clear();

        });

        if(demi.pageoverlays[demi.page].hasOwnProperty("objects"))
        {
          var i = 0;
          demi.pageoverlays[demi.page].objects.forEach(function(obj) {
                      if(obj.type == "cjk-vertical" || obj.type == "image")
                        {
                        cjkdefer.push(obj);
                        demi.pageoverlays[demi.page].objects[i] = null;
                        }
                      i++;
                      });
          demi.pageoverlays[demi.page].objects = demi.pageoverlays[demi.page].objects.filter(item => item !== null);
          demi.castcanvas.loadFromJSON(demi.pageoverlays[demi.page], demi.castcanvas.renderAll.bind(demi.castcanvas), function(o, object) {});
          cjkrestore.forEach(function(obj) {demi.pageoverlays[demi.page].objects.push(obj)});
          demi.castcanvas.renderAll();
        }
        else
        {
          var i = 0;
          demi.pageoverlays[demi.page].forEach(function(obj) {
                      if(obj.type == "cjk-vertical" || obj.type == "image")
                        {
                        cjkdefer.push(obj);
                        demi.pageoverlays[demi.page][i] = null;
                        }
                        i++;
                      });
          demi.pageoverlays[demi.page].objects = demi.pageoverlays[demi.page].objects.filter(item => item !== null);
          demi.castcanvas.loadFromJSON({objects: demi.pageoverlays[demi.page]}, demi.castcanvas.renderAll.bind(demi.castcanvas), function(o, object) {});
          cjkdefer.forEach(function(obj) {demi.pageoverlays[demi.page].objects.push(obj)});
          demi.castcanvas.renderAll();
          }

        if(cjkdefer.length > 0)
        {
          demi.deserializeCJK(cjkdefer);
          cjkdefer = [];
        }

        demi.demiCanvasSort();

      //serialize pages and export demidoc
              var demidoc = '{\n"IIIFmanifest": "' + demi.tilesources + '", \n';
              demidoc    += '"DemiOverlaygroups": ' + JSON.stringify(demi.overlaygroups) + ', \n';
              demidoc    += '"DemiCurationFolders": ' + JSON.stringify(demi.curationfolders) + ', \n';
              demidoc    += '"DemiCurationItems": ' + JSON.stringify(demi.curationitems) + ', \n';
              demidoc    += '"DemiData": ' + JSON.stringify(exp);
              demidoc    += '\n}'

              var file = new Blob([demidoc], {type: 'application/json'});

                    var a = document.createElement("a")
                    var url = URL.createObjectURL(file);
                    a.href = url;
                    a.download = "demidoc.json";
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 0);

    }

}
