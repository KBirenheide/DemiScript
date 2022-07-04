class DemiScript
{
  constructor(canvas)
  {
    this.canvas = canvas;
    this.tilesources;
    this.viewer;
    this.overlay;
    this.castcanvas;
    this.pageoverlays = [];
    this.page = 0;

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
             				                objects[i].angle = (newRotateUnit * 10);
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
             				                objects[i].angle = (newRotateUnit * 10);
             				            }
             				            this.overlay.fabricCanvas().renderAll();
             				            this.RotateUnit = newRotateUnit;
             				        }

    this.TriggerRoatation = function (newRotateUnit) {
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
    //Called to asynchronously obtain the indicated IIIF-compliant JSON Manifest
    constructviewer(tilesources)
    {
      this.tilesources = tilesources;

      return new Promise((resolve, reject) => {
            jQuery.getJSON(tilesources).then(data => {
                resolve(this.setviewer(data));
            }, error => {
              reject(console.log("failed to load tile sources"));
            });
        });

    }

    //Called to create an OpenSeadragon viewer using a IIIF-compliant JSON Manifest
    setviewer(infojson)
    {
      var tilesources = [];
      var mjsequence = infojson.sequences[0];
      var i = 0;

      jQuery("body").append("<div id='demi_blackblock'></div><div id='demi_lightbox'><div class='demi_lightinner' id='demi_thumbs'><h2>Document Pages</h2></div><div class='btnwinemid' id='demi_closelb'>X</div></div>");

      mjsequence.canvases.forEach(canvas => {

        var mjimage = canvas.images[0].resource.service['@id'];
        var infojson = mjimage + "/info.json";

        var manifestjson;
        var makethumb = canvas.thumbnail['@id'];

        i++;

        var demithumb = "<div data-pageno=\"" + i + "\" class=\"indexthumbs\" onmouseover=\"jQuery(\'#pagethumb" + i + " img\').css(\'opacity\', \'1\');\" onmouseout=\"jQuery(\'#pagethumb" + i + " img\').css(\'opacity\', \'0.7\');\" id=\"pagethumb" + i + "\" style=\"cursor: pointer; width: 200px; margin: 3px auto; position: relative;\"><img style=\"width: 100%; opacity: 0.7;\" src=\"" + makethumb + "\" /><div style=\"bottom: 3px; right: 3px; font-weight: 800; font-size: 175%; position: absolute;   text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff,-1px 1px 0 #fff,1px 1px 0 #fff;\">" + i + "</div></div>";

        jQuery("#demi_thumbs").append(demithumb);

        tilesources.push(infojson);
      });

      var demi = this;

      jQuery(".indexthumbs").on("click", function (event) {
              var pageno = jQuery(this).attr("data-pageno");
              demi.setdocumentpage(pageno);
              demi.collapser();
            });

      this.viewer = OpenSeadragon({
  				id: this.canvas,
  				allowZoomToConstraintsOnResize: true,
  				showNavigator:  false,
  				tileSources: tilesources,
          sequenceMode: true,
  				prefixUrl: "../sites/demiscript/js/openseadragon/images/",
  				maxZoomLevel: 30,
  				minZoomLevel: 0.25,
          showRotationControl: true,
  				overlays: [{
  					id: "whitesheet",
  					x: 0,
  					y: 0,
  					width: 2,
  					height: 2,
  					className: "bleach"
  				          }]
          });

          demi.viewer.addHandler("rotate", function(obj)
                          {
                          demi.TriggerRoatation(obj.degrees / 10);
                          jQuery("#rotateslider").slider("value", 0);
                          });

          //pageoverlayswitch
          demi.viewer.addHandler("page", function (obj)
                      		{
                            var newpage = obj.page;
                            var curpage = demi.page;
                            demi.page = obj.page;

                            demi.viewer.viewport.setRotation(0);

                            var tmppage = [];

                            jQuery("#pagethumb" + (curpage + 1)).removeClass("activepagethumb");
                      			jQuery("#pagethumb" + (newpage + 1)).addClass("activepagethumb");

                            demi.castcanvas.forEachObject(function(obj) {
                                        tmppage.push(obj);
                                        demi.castcanvas.remove(obj);
                                        });

                            demi.pageoverlays[curpage] = tmppage;

                            if(typeof demi.pageoverlays[newpage] !== "undefined")
                            {
                            demi.pageoverlays[newpage].forEach(function(obj) {
                                        demi.castcanvas.add(obj);
                                        });
                            }
                          });

          // Append Editor Overlay
          var demieditor = '<div class="savebar">';

            demieditor += '<button class="btngreensingle" id="thumbnails" style="width: 50px; height: 50px;"><i class="material-icons md-24" style="">auto_stories</i></button>';

            demieditor += '<button class="btngreensingle" id="demisave" style="width: 50px; height: 50px; margin-left: 2px;"><i class="material-icons md-24" style="">save</i></button>';

            demieditor += '</div>';

            demieditor += '<div class="addlinebar">';
            //Group Objects Button
            demieditor += '<button class="btngreensingle" id="groupobjects"><i class="material-icons md-18" style="transform: rotate(90deg);">select_all</i></button>';
            //Ungroup Objects Button
            demieditor += '<button class="btngreensingle" id="ungroupobjects" style="margin-left: 2px;"><i class="material-icons md-18" style="">dashboard</i></button>';

            //Line Insert
            demieditor += '<input type="text" title="Text Line" value="ニューライン" id="insertline1" onchange="" style="margin-left: 2px;"/><div style="display: inline-block;">';
            demieditor += '<button title="Insert Text, Horizontal" class="btngreenmid" id="addline" style=""><i class="material-icons md-18" style="">playlist_add</i></button>';
            demieditor += '<button title="Insert Text, Vertical" class="btngreenmid" id="addvertical" style=""><i class="material-icons md-18" style="transform: rotate(90deg);">playlist_add</i></button>';
            demieditor += '<button style="" onclick="tmpclass.cloneaddline();" title="Insert text, copy settings from active object." class="btngreenright"><i class="material-icons md-18" style="transform: rotate(90deg);">wrap_text</i></button></div>';

            demieditor += '<button class="btngreensingle" type="button" id="polymake" style="margin-left: 2px;"><i class="material-icons md-18" style="transform: rotate(90deg);">share</i></button>';

          demieditor += '</div>';

          jQuery("#" + this.canvas).append(demieditor);

          jQuery("#addline").on("click", function (event) {
                  demi.addline("horizontal");
                });
          jQuery("#addvertical").on("click", function (event) {
                  demi.addline("vertical");
                });

          //Grouping and Ungrouping Buttons
          jQuery("#groupobjects").on("click", function (event) {
                  demi.initgrouping();
                  });
          jQuery("#ungroupobjects").on("click", function (event) {
                  demi.ungroup();
                  });

          //Polygon Button
          jQuery("#polymake").on("click", function (event) {
                  demi.polygon();
                  });

          //DemiDocSave Button
          jQuery("#demisave").on("click", function (event) {
                  demi.exportdemi();
                  });

          //Show Pages Thumbnails
          jQuery("#thumbnails").on("click", function (event) {
                  demi.expander("demi_thumbs");
                  });

          //Close Lightbox
          jQuery("#demi_closelb").on("click", function (event) {
                  demi.collapser("demi_closelb");
                  });

          // Initiate Fabric Overlay
          this.overlay = this.viewer.fabricjsOverlay({scale: 5000});

          this.castcanvas = this.overlay.fabricCanvas();

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
      jQuery("#demi_blackblock").hide();
      jQuery("#demi_lightbox").hide("slow");
    }

    //Retrieves Fabric.js Overlayobjects from a local JSON file to overlay over the active OpenSeadragon viewer
    constructfabric(fabricfile)
    {

        							var fabricobjects = fabricfile;
                      console.log(fabricfile);

                      var text = new fabric.IText("", { fontSize: 0, left: 0, top: 0,  fill: "#000" });

                      this.overlay.fabricCanvas().add(text);

                      this.castcanvas.loadFromJSON(JSON.parse(JSON.stringify(fabricobjects).split("[cbr]").join("\\n")), this.castcanvas.renderAll.bind(this.castcanvas),function(o,object){
                      object.setCoords();
                    });
                    this.viewer.viewport.setRotation(0);
    }

    //Change to different page on IIIF-Document and load corresponding overlay.
    setdocumentpage(pageno)
    {
      var demi = this;
      pageno--;
      demi.viewer.goToPage(pageno);
    }

    //Insert a Text Line
    addline(direction = "horizontal", linesource="#insertline1", setleft=0, settop=0, originX = "left", originY = "top", fontsize=120, textBackgroundColor = "rgba(0,0,0,0)")
    {
        this.viewer.viewport.setRotation(0);
        var toadd = jQuery(linesource).val();

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
                var text = new CJKTextbox(splittext, {id: demi.assignnewid(), pairing: demi.assignnewid(), break: true, tei: "notag", teisub: "notag", furigana: "", display: true, fontSize: fontsize, left: setleft, top: spacer, originX: originX, originY: originY, fill: "rgba(0,0,0,1)", textBackgroundColor: textBackgroundColor, lineHeight: 1.13, angle: rotation, fontWeight: "normal", opacity: 1, skewX: 0, skewY: 0, overlaysection: "main"});
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
                var text = new CJKTextbox(splittext, {id: demi.assignnewid(), pairing: demi.assignnewid(), break: true, tei: "notag", teisub: "notag", furigana: "", display: true, fontSize: fontsize, left: setleft, top: spacer, originX: originX, originY: originY, fill: "rgba(0,0,0,1)", textBackgroundColor: textBackgroundColor, lineHeight: 1.13, angle: rotation, fontWeight: "normal", opacity: 1, skewX: 0, skewY: 0, overlaysection: "main"});
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
              /*this.castcanvas.discardActiveObject();
              var sel = new fabric.ActiveSelection(newgroup, {
                canvas:   this.castcanvas,
              });
              this.castcanvas.setActiveObject(sel);
              this.castcanvas.getActiveObject().toGroup();
              this.castcanvas.requestRenderAll();*/

            }
            else
            {
              var text = new CJKTextbox(toadd, {type: "cjk-vertical", id: this.assignnewid(), pairing: this.assignnewid(), break: true, tei: "notag", teisub: "notag", furigana: "", display: true, fontSize: fontsize, left: setleft, top: settop, originX: originX, originY: originY, fill: "rgba(0,0,0,1)", textBackgroundColor: textBackgroundColor, lineHeight: 1.13, angle: 0, fontWeight: "normal", opacity: 1, skewX: 0, skewY: 0, overlaysection: "main"});
              this.castcanvas.add(text);
            }
        }
        else
        {
        toadd = toadd.replace(/{br}/g, "\\n");
        var text = new fabric.IText(toadd, {id: this.assignnewid(), pairing: this.assignnewid(), break: true, tei: "notag", teisub: "notag", furigana: "", display: true, fontSize: fontsize, left: setleft, top: settop, originX: originX, originY: originY, fill: "rgba(0,0,0,1)", textBackgroundColor: textBackgroundColor, lineHeight: 1.13, fontWeight: "normal", opacity: 1, skewX: 0, skewY: 0, overlaysection: "main"});
        this.castcanvas.add(text);
        }

        this.castcanvas.renderAll();

    }

    //Initiate Object Grouping Mode
    initgrouping()
    {

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
                  fill: "rgba(0,150,255,0.4)",
                  strokeWidth: 1,
  								stroke: "rgba(0,0,0,0.7)",
                  transparentCorners: false,
                  id: demi.assignnewid(),
                  pairing:"",
                  break:"",
                  tei:"",
                  teisub:"",
                  furigana:"",
                  display:"",
                  comment:"",
                  section:"",
                  de_de:"",
                  en:"",
                  overlaysection:""
                });
                completerect = true;

                demi.castcanvas.add(rect);

            }
            else
            {
                var newgroup = [];
                rect.setCoords();
                demi.castcanvas.forEachObject(function(obj) {
                              if (obj === rect) return;
                              if(rect.intersectsWithObject(obj))
                              {
                                newgroup.push(obj);
                              }
                            });

                  if (newgroup.length > 0)
                  {
                    demi.castcanvas.discardActiveObject();
                      var sel = new fabric.ActiveSelection(newgroup, {
                        canvas:   demi.castcanvas,
                          });
                    demi.castcanvas.setActiveObject(sel);
                    demi.castcanvas.getActiveObject().toGroup();
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

    //Ungroup active selection
    ungroup()
    {
      if (!this.castcanvas.getActiveObject()) {
      return;
      }
      if (this.castcanvas.getActiveObject().type !== 'group') {
        return;
      }
      this.castcanvas.getActiveObject().toActiveSelection();
      this.castcanvas.requestRenderAll();
    }

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

      console.log(demi.lines);

      demi.lines.forEach(function (line) {
      demi.overlay.fabricCanvas().remove(line);
      });

      demi.overlay.fabricCanvas().add(demi.makePolygon()).renderAll();
      demi.lines.length = 0;
      demi.polygonPoints.length = 0;
      demi.overlay.fabricCanvas().getActiveObject().trigger("deselected");
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
      selectable: true,
      id: demi.assignnewid(),
      pairing:"",
      break:"",
      tei:"",
      teisub:"",
      furigana:"",
      display:"",
      comment:"",
      section:"",
      de_de:"",
      en:"",
      overlaysection:""
      });
    }

    exportdemi()
    {
      this.pageoverlays[this.page] = this.castcanvas.getObjects();
      var overlays = JSON.stringify(this.pageoverlays);
      var demidoc = '{\nIIIFmanifest: "' + this.tilesources + '", \n';
      demidoc    += 'DemiData: ' + overlays;
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
