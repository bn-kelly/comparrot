

(function() {

  var temp = '[[712,&quot;bestbuy.com&quot;,156074],[156813,&quot;walmart.com&quot;,156074],[156863,&quot;footlocker.com&quot;,156074],[156899,&quot;www.crocs.com&quot;,156074],[157497,&quot;lenovo.com&quot;,156074],[157993,&quot;kohls.com&quot;,156074],[158438,&quot;gilt.com&quot;,156052],[159498,&quot;champssports.com&quot;,156074],[160582,&quot;adorama.com&quot;,156074],[160629,&quot;everlast.com&quot;,156052],[161992,&quot;nautica.com&quot;,156052],[162288,&quot;missguidedus.com&quot;,156178],[162751,&quot;oldnavy.gap.com&quot;,156074],[163660,&quot;www.ulta.com&quot;,156074],[175846,&quot;www.shutterstock.com&quot;,156074],[178807,&quot;hellofresh.ca&quot;,156074],[180498,&quot;skinstore.com&quot;,156178],[187771,&quot;luckybrand.com&quot;,156052],[190643,&quot;dealdash.com/?utm_source=flexoffers&amp;utm_medium=cpa&quot;,24],[192568,&quot;bedandbathemporium.com&quot;,156178],[195731,&quot;freshly.com&quot;,156074],[200742,&quot;chefsplate.com&quot;,156074],[200803,&quot;fool.com&quot;,156178],[201227,&quot;acorns.com&quot;,156074],[202999,&quot;hydroflask.com&quot;,156099],[211654,&quot;plants.com&quot;,156074],[212015,&quot;bedthreads.com.au&quot;,156182],[212708,&quot;redbubble.com&quot;,156074],[213014,&quot;www.shein.co.uk&quot;,156178],[215855,&quot;vybepercussion.com/&quot;,24]]';
  if (temp.length != 0) {
    var text = temp.replace(/&quot;/g, '\"');
    text = text.replace(/\s/g, '');
    text = JSON.parse(text);

    var flex_convert_domains = text;
    var flex_user_id = 1241601;
    var fcd_len = flex_convert_domains.length;

    var atags = document.getElementsByTagName("a"),
    len = atags.length;

    while (len--) {
      for (i = 0; i < fcd_len; i++) {
        var do_break = false;
        var domains = flex_convert_domains[i][1].split("|");
        for ( j = 0; j < domains.length; j++ ) {
          var du = new URL("http://" + domains[j]);

          if (atags[len].host.includes(du.host) && (du.pathname.length <= 1 
            || atags[len].pathname.startsWith(du.pathname))) 
          {
            atags[len]["href"] = "https://track.flexlinks.com/g.ashx?foid="  
              + flex_convert_domains[i][2]
              + "." 
              + flex_convert_domains[i][0] 
              + "&trid="
              + flex_user_id
              + "."
              + flex_convert_domains[i][0] 
              + "&foc=19&fot=9999&fos=1" 
              + "&url=" 
              + encodeURIComponent(atags[len]["href"]);

            do_break = true;
            break;
          }
        }

        if (do_break) {
          break;
        }
      }
    }
  }
})();
  
