jQuery( document ).ready(function() {
var demiviewer = new DemiScript("demiscriptviewer");

jQuery("#tilesourcebtn").on("click", function (event) {
  demiviewer.constructviewer(jQuery("#tilesourcer").val());

});

jQuery("#demifest").on("change", function (event)
    {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(event.target.files[0]);

    });

    function onReaderLoad(event)
    {
        console.log(event.target.result);
        var obj = JSON.parse(event.target.result);
        demiviewer.constructfabric(obj);
    }

    jQuery("#rotateslider").slider({
    min: -180,
    max: 180,
    slide: function(event, ui) {
        demiviewer.viewer.viewport.setRotation(ui.value);
    }
    });

    jQuery( "#overlayslider" ).slider({
                step: 0.05,
                value: 0.3,
                max: 1,
                min: 0,
                orientation: "horizontal",
                slide: function( event, ui ) {

    jQuery( "#whitesheet" ).css("opacity", ui.value);

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

});
