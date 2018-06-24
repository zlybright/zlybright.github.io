var ispc = (function() {
  var userAgentInfo = navigator.userAgent;
  var Agents = ["Android", "iPhone",
        "SymbianOS", "Windows Phone",
        "iPad", "iPod" ];
  var flag = true;
  for (var v = 0; v < Agents.length; v++) {
    if (userAgentInfo.indexOf(Agents[v]) > 0) {
      flag = false;
      break;
    }
  }
  return flag;
})(); 

var slides = [];

function slide (option){  
    this.init(option);
    slides.push(this);
}
slide.prototype = { 

    init:function(option){  
        this.option = option;
        this.el = option.el; 

        this.scrollLoop = this.option.scrollLoop
        this.prevbtn = $(option.prev)
        this.nextbtn = $(option.next) 
 

        this.initElements();
        this.initEvents();
 

        if(this.option.autoPlay){
            this.autoPlay();
        }
        //this.initLazyLoad();
    },
    fnComputeElementRect :function(elem, offset , isOuter){
        var pos =   elem.offset();
        var left = pos.left , 
            top = pos.top , 
            right = left + (isOuter ? elem.outerWidth(): elem.width()), 
            bottom = top + (isOuter ? elem.outerHeight(): elem.height());

        if(offset){     
            offset.width && (right += offset.width);
            offset.left && (left -= offset.left);
            offset.top && (top-=offset.top);
            offset.height && ( bottom +=offset.height);
        } 
        return {
            left:left,
            top : top ,
            right:right,
            bottom : bottom
        }
    },
    initLazyLoad:function(num){
        if(!this.lazyImages){
            return;
        }
        var flag = false;
        if(!num){
            num = this.lazyImages.length;
            flag = true;
        }
        for(var i=0;i<num;i++){
           var el =  $(this.lazyImages[i]);
           var src = el.attr("lazySrc")
           if(!src){continue;}
           el.attr("src" , src).removeAttr("lazySrc");
        }  
        if(flag){
            this.lazyImages = null;
        } 
    },
    initEvents:function(){
        var _this = this;

        this.el.bind("scroll2End" , function(){
             _this.fnScroll2End()
        });
        this.el.bind("scroll2Start" , function(){ 
            _this.fnScroll2Start()
        });

        this.prevbtn.click(function(){            
            //_this.pause(); 
            _this.prev();
        });
        this.nextbtn.click(function(){         
            //_this.pause();
            _this.next();
        }); 
 

        if(!ispc){
            this.initMobileEvents();            
        }

        this.el.hover(function(){
            _this.pause()
        }, function(){
            if(_this.option.autoPlay){
                 _this.autoPlay();
            }
        })
        if(this.pageSwitch && this.pageSwitch.items){
            this.pageSwitch.items.click(function(){
                var idx =$(this).index();
                _this.currentStep = idx;
                _this.go();
            })
        }

    },
    pause:function(){

        if(this.autoTimer){
            clearInterval(this.autoTimer);
            this.autoTimer = null;
        }
    },

    autoPlay:function(){

        var _this = this;

        this.pause();

        this.autoTimer = setInterval(function(){ 

            if(_this.currentStep==(_this.stepArr.length-1)){
                _this.currentStep = 0; _this.go(); return;
            }
            _this.next()
        
        } , this.option.autoPlay);
    },
    initMobileEvents:function(){
        var _this = this;
        //this.slideitems.find("a").attr("href" , "#");
        this.slideitems.find("a").each(function(){
            var lnk = $(this);
            var url = lnk.attr("href");
            lnk.attr("href" , "#").attr("url" , url);

        })

      //  this.el.css("position", "relative");
        var posx = this.el.offset().left;
       

        var dragEl = this.slideInline.get(0);
     //   dragEl.css("position", "absolute")
        var stx = 0 , orileft = 0 ,ooff=0;
        var movefn = function(evt){
            if(evt.targetTouches.length > 1){
                return
            }
            var tx =  evt.targetTouches[0].pageX;
              ooff=  tx-stx;
            var ml = (orileft + ooff) + 'px'
            
            //console.log(ml);
           $(dragEl).css("margin-left" , ml )
        } 


        var endfn = function(evt){
          //  console.log(ooff)
            if(ooff>50){
                _this.prev("go")
            }else if(ooff<-50){
                 _this.next("go")
            }else if(ooff==0){
               var lnk = $(evt.target).closest("a")
               window.location.href = $(lnk).attr("url") 
            }

            dragEl.removeEventListener("touchmove", movefn);
            dragEl.removeEventListener("touchend" , endfn);
            ooff = 0;
        }

        var startfn = function(evt){
            _this.pause();    
            stx =  evt.targetTouches[0].pageX; 
            orileft = $(dragEl).css("margin-left").replace("px","") || 0; 
            orileft = parseInt(orileft);
            dragEl.addEventListener("touchmove" , movefn);
            dragEl.addEventListener("touchend" , endfn);

        }
        dragEl.addEventListener("touchstart" , startfn )
 
    },
    initElements:function(){ 

        this.el.css({overflow:"hidden",height:'auto'})
  
        this.scroll2Pos = 0;

        this.slideitems = this.el.find(".slide-item");

        this.slideInline = this.el.find(".slide-inline");

        this.slideInline.css("width","20000px");

        this.slideitems.css({float:"left" , display:"block"})

        this.lazyImages =  this.slideitems.find("img[lazySrc]");

        this.pageSwitch = this.option.pageSwitch;

        this.computeItemPosArray();

        if(this.totalDistance < this.containerw){
            this.prevbtn.hide();
            this.nextbtn.hide();
             return;
        }

        this.computeNextPosArray(); 

        if(this.option.scrollbar){
             this.createScrollBar();
        } 
 
    },
    computeScrollParam:function(){
        var maxleft  = this.containerw  -  this.scrollBar.width();
        var scrollPer = this.stepArr[this.stepArr.length-1] / maxleft;
        this.maxScrollLeft = maxleft;
        this.scrollPer = scrollPer;
        this.scrollBar.css("left",0);
    },
    createScrollBar:function(){
        //this.el.css("position", "relative");
        var html =  '<div style="position:relative;height:1px">'+
        '<div style="position:absolute;height:40px;width:100%;top:-20px;cursor:pointer">' +
        '<div style="left:0;display:none;border-radius:3px;top:17px;position:absolute;width:40%;height:6px;background-color:#999"></div></div></div>'
       // html += '<div style="cursor:pointer; background-color:#999;width:50%;height:10px;position:relative;left:0" class="slide-block"></div></div>'
        this.el.after(html);
        var scbar = this.el.next().children().children() ,
          doc =  $(document);
        

        var _this = this;  

        var cx = 0 , offset = 0 , lastmove= 0 , isMoving= false, lx=-1,ly=-1;

        this.scrollBar = scbar; 
        this.computeScrollParam();
 

        var fnMouseUp = function(ev){
             var lleft = parseInt(scbar.css("left").replace("px", "")) * _this.scrollPer;                 
             for(var i=0;i< _this.stepArr.length;i++){
                 if(lleft >= _this.stepArr[i] && lleft <= _this.stepArr[i+1]){
                    _this.currentStep = i;
                    //console.log(_this.currentStep);
                    break;
                 }
             } 
             doc.unbind("mousemove")   
             doc.unbind("mouseup")   
             isMoving = false;     

             //console.log(ev.pageX ,ev.pageY)
           
             fnHideScbar(ev);      
        }

        var fnMouseMove = function(ev){
            
            offset =  ev.pageX - cx;
    
            var left = offset + lastmove;
           

            if(left<0){
                left = 0;
            }else if(left > _this.maxScrollLeft){
                left = _this.maxScrollLeft;
            }else{
                _this.prevbtn.removeClass("disable");
                _this.nextbtn.removeClass("disable");
            }

            scbar.css("left" , left + 'px')
        
            _this.slideInline.css("margin-left" , -parseInt(left * _this.scrollPer) + 'px')
            _this.initLazyLoad();
            //console.log(offset, maxleft, "move");
        }

        var fnMouseDown = function(ev){

           cx = ev.pageX  ;

           lastmove = parseInt(scbar.css("left").replace("px", ""));
            
           //console.log(cx, "mousedown")
           isMoving=true;
           doc.bind("mousemove" , fnMouseMove)    
           doc.bind("mouseup" , fnMouseUp)  
        }

        scbar.parent().bind("mousedown" , fnMouseDown)    
         
        var fnShowScbar = function(){
            scbar.fadeIn(function(){
                scbar.css("opacity",1);
            });            
        } 

        var fnMouseInEl = function(x, y){
            var r = _this.fnComputeElementRect(_this.el,{height:10} , true);          
          
            if((x > r.left && x < r.right) && (y > r.top && y < r.bottom )) {
                return true;
            } 
            return false;
        }

        var fnHideScbar = function(ev){           

            if(isMoving){
                return;
            }
            
            if(fnMouseInEl(ev.pageX , ev.pageY)){
                return;
            }
            
            //console.log(ev)

            
            scbar.fadeOut();

             
        }

        _this.el.hover(fnShowScbar , fnHideScbar)  
        scbar.parent().hover(fnShowScbar ,fnHideScbar)
        
    }, 
    
    
    computeItemPosArray:function(){ 
        this.itemPosArr = [0];
        var w = 0; 
        for(var i=0;i<this.slideitems.length;i++){ 
            w += $(this.slideitems[i]).outerWidth(true);
            this.itemPosArr.push(w);
        } 
        this.totalDistance = w;
        this.containerw = this.el.outerWidth(true); 
    },
 
    computeNextPosArray:function(){ 

        var flag = false, tempScrollPos = 0 , tempItemIndex = 0 , tempContainerWidth = this.containerw ;

        this.stepArr = [];
      
        this.currentStep = 0; 

        while(tempScrollPos < this.totalDistance){ 

            tempScrollPos =  this.itemPosArr[tempItemIndex]

            if(tempScrollPos == 0){
                 this.stepArr.push(0);
                 tempItemIndex++;
                 continue;
            }
            if(tempScrollPos == tempContainerWidth){
                 this.stepArr.push(tempScrollPos);
                 tempContainerWidth += this.containerw;
                 tempItemIndex++;
                 continue;
            } 
          
            for(var i=tempItemIndex;i<this.itemPosArr.length;i++){
                tempScrollPos =  this.itemPosArr[i]

                if(tempScrollPos > tempContainerWidth){
                    tempItemIndex = i;   
                    this.stepArr.push(this.itemPosArr[i-1])
                    tempContainerWidth = this.itemPosArr[i-1] + this.containerw ; 
                    //console.log(tempContainerWidth , this.totalDistance)
                    break;
                } 
            } 
            flag = true;
         
        } 

        var stepLastNum = this.stepArr.length-1
        var lastdis = this.totalDistance - this.containerw;
        this.stepArr[stepLastNum] =  lastdis;
        
        if(this.stepArr[stepLastNum-1]){
             var dis =  lastdis - this.stepArr[stepLastNum-1]
             if(dis< (this.option.lastItemOffset || 50)){
                this.stepArr.splice(stepLastNum , 1);
             }
        }

    },

    fnScroll2Start:function(){
        if(this.scrollLoop == false){
            this.prevbtn.addClass("disable")
        }         
    },
    fnScroll2End:function(){
        if(this.scrollLoop == false){
            this.nextbtn.addClass("disable")
        }
    }, 

    prev:function(goflag){ 
  
        if(this.currentStep==0 && this.option.scrollLoop == false){
            if(goflag == "go"){ this.go(); }
            else{
                this.rollback();
            }
            //this.go()
            return; 
        }
        
        if(this.currentStep == 0){
            this.currentStep = this.stepArr.length -1;
        }else{
            this.currentStep -- ;

            if(this.currentStep== 0){
                this.el.trigger("scroll2Start"); 
            }
        }       

        this.nextbtn.removeClass("disable")
        this.go()

    },
    
    next:function(goflag){

        if(this.currentStep==(this.stepArr.length-1) && this.option.scrollLoop == false){
            if(goflag == "go"){ this.go(); }
            else{
                this.rollback();
            }

            return; 
        }

        if(this.currentStep == (this.stepArr.length -1)) {
            this.currentStep = 0;
        }else{
            this.currentStep ++;

            if(this.currentStep == (this.stepArr.length -1)){
                this.el.trigger("scroll2End"); 
            }
        }       
        
        this.prevbtn.removeClass("disable")
        this.go()

    },

    go:function(){ 
        this.pause();
 
        var pos = this.stepArr[this.currentStep];  
        var _this = this;

        if(this.pageSwitch){
            this.pageSwitch.items.removeClass( this.pageSwitch.activeClass )
            $(this.pageSwitch.items[this.currentStep]).addClass(this.pageSwitch.activeClass)
        }



        this.slideInline.stop(true).animate({"margin-left" : '-' + pos+ 'px' },500,function(){
            _this.initLazyLoad();  
            // if(this.autoTimer){
            //     return; 
            // }     
            if(_this.option.autoPlay){
                _this.autoPlay(); 
            }       

        });

        if(this.option.scrollbar){
            var l = parseInt( pos / this.scrollPer ) + "px"
            this.scrollBar.stop(true).animate({"left" : l } , 500);
        } 
    },
    rollback : function(){         
        if(this.currentStep == 0){
            this.slideInline.stop(true).animate({"margin-left" : '50px' },400,function(){
                $(this).animate({"margin-left":0 } , 200);
            });          
        }else if(this.currentStep == (this.stepArr.length-1)) {
            var pos = this.stepArr[this.currentStep];  
            this.slideInline.stop(true).animate({"margin-left" : '-' + (pos + 50) + 'px' },400,function(){
                $(this).animate({"margin-left" : '-' + pos+ 'px' },200)
            });
        } 
    },
    reassign:function(){ 

        var newelw = this.el.width()
     
        if(newelw == this.containerw){
            return;
        } 
        
        this.computeItemPosArray();
        
        if(this.totalDistance < this.containerw){
            return;
        }   


        this.computeNextPosArray(); 

        this.option.scrollbar && this.computeScrollParam();

        this.slideInline.css({"margin-left" :0 });

        this.nextbtn.removeClass("disable");
        this.prevbtn.addClass("disable");

       
    }
 
}

$(window).bind("resize" , function(){ 
    for(var i=0;i<slides.length;i++){        
        slides[i].reassign();
    }
});
 