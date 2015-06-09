var canvas,ctx,frame,seam;
var G,F;

function $(name){
	return document.getElementById(name);
}

function init(){
		canvas = $("canvas");
		frame = $("frame");
		if(!(ctx = canvas.getContext("2d"))){
			var header = $("container");
			header.innerHTML = "你的浏览器不支持Canvas~";
			return;
		}
		
		ctx.resetImage = function(){
			if(!this.orgImageData){
				alert("error!");
				return;
			}
			
			this.reseted = true;
			seam = [];
			this.tarHeight = this.height = canvas.height = this.orgImageData.height;
			this.tarWidth = this.width = canvas.width = this.orgImageData.width;
			frame.style.width = this.width;
			frame.style.height = this.height;
			this.image = this.orgImageData;
			this.putImageData(this.image, 0, 0);
			
			//TODO:控制台部分
			var ctrlWidth = $("width"),
				ctrlHeight = $("height");
				
			ctrlWidth.min = Math.floor(this.width/2);
			ctrlHeight.min = Math.floor(this.height/2);
			ctrlWidth.max = this.width;
			ctrlHeight.max = this.height;
			ctrlWidth.value = this.width;
			ctrlHeight.value = this.height;
			
			$("cmpFrame").style.display = "none";
		}
		
		ctx.copyImageData = function(src){
			var tar = this.createImageData(src);
			for(var i = 0,len = tar.data.length; i < len; i+=1){
				tar.data[i] = src.data[i];
			}
			return tar;
		}
		
		ctx.loadImage = function(src){
			var img = new Image();
			//img.crossOrigin="anonymous";
			this.src = img.src = src;
			var tCanvas = document.createElement("canvas"), tCtx = tCanvas.getContext("2d");
			
			img.onload = function(){
				tCanvas.width = img.width;
				tCanvas.height = img.height;
			
				tCtx.drawImage(img,0,0);
				ctx.orgImageData = tCtx.getImageData(0, 0, img.width, img.height);
				ctx.image = ctx.copyImageData(ctx.orgImageData);
				ctx.resetImage();
			}
		}
		
		ctx.drawFrame = function(){
			
			this.globalAlpha = 0.2;
			
			if(this.tarWidth < this.width){
				this.fillRect(this.width, 0, this.tarWidth - this.width, this.tarHeight);
			}
			
			if(this.tarHeight < this.height){
				this.fillRect(0, this.height, this.tarWidth, this.tarHeight - this.height);
			}
			
			if(this.tarWidth < this.width && this.tarHeight < this.height){
				this.fillRect(this.width, this.height,
							  this.tarWidth - this.width,
							  this.tarHeight - this.height);
			}
			
			this.globalAlpha = 1;
		}
		
		ctx.setTarWidth = function(width){
			this.tarWidth = width;
			this.reDraw();
		}
		
		ctx.setTarHeight = function(height){
			this.tarHeight = height;
			this.reDraw();
		}
		
		ctx.setEnhance = function(){}
		ctx.setRemoval = function(){}
		
		ctx.pauseRetarget = function(){
			this.flagPause = true;
		}
		
		ctx.saveImage = function(){}
		
		ctx.reDraw = function(flagDrawSeam){
			this.width = canvas.width = this.image.width;
			this.height = canvas.height = this.image.height;
			this.putImageData(this.image, 0, 0);
			
			//TODO:画增强、减弱区
			////
			
			//TODO:绘制Seam线
			this.fillStyle = "#FF0000";
			if(seam){
				for(var i = 0,len = seam.length || 0; i < len; i++){
					this.fillRect(seam[i].x,seam[i].y,1,1);
				}
			}
			////
			
			this.drawFrame();
		}
		
		ctx.calcEnergy = function(){
			/*1.灰度化处理，结果存储在G[][]中
			2.梯度处理,结果存储在F[][]中
			*/
			var width = this.width, height = this.height, data = this.image.data;
			
			if(this.reseted || !G){
				G = new Array(width);
				F = new Array(width);
				for(var i = 0; i < width; i++){
					G[i] = new Array(height);
					F[i] = new Array(height);
				}
			}
			
			for(var i=0,x=0,y=0,len=data.length; i < len; i+=4,x++){
				if(x == width){
					x = 0; 
					y ++ ;
				}
				//G[x][y] = 0.2126*data[i] + 0.7152*data[i+1] + 0.0722*data[i+2];
				G[x][y] = data[i] + data[i+1] + data[i+2];
			}
			
			function d(x,y){
				return (x>=0 && x<width && y>=0 && y<height)?G[x][y]:0;
			}
			
			for(var i = 0; i < width; i++){
				for(var j = 0; j < height; j++){
					dx = d(i-1,j+1) + 2*d(i,j+1) + d(i+1,j+1) - d(i-1,j-1) - 2*d(i,j-1) - d(i+1,j-1);
					dy = d(i-1,j-1) + 2*d(i-1,j) + d(i-1,j+1) - d(i+1,j-1) - 2*d(i+1,j) - d(i+1,j+1);
					//console.log(i+" "+j);
					F[i][j] = Math.abs(dx) + Math.abs(dy);
				}
			}
			
		}
		
		ctx.runDPX = function(){//X方向seam
			D = [];
			D[0] = [];
			
			var width = this.width,height = this.height;
			
			//初始化第一列
			for(var i = 0; i < height; i++){
				D[0][i] = {v : F[0][i], dir : undefined, carved : false};
				/*D[0][i] = F[0][i];
				D[0][i].dir = undefined;*/
			}
			
			for(var i = 1; i < width; i++){
				D[i] = [];
				for(var j = 0; j < height; j++){
					var bVal = Number.MAX_VALUE,bDir;
					for(var k = -1; k <= 1; k ++){
						if(j+k>=0 && j+k < height && D[i-1][j+k].v<bVal){
							bVal = D[i-1][j+k].v ;
							bDir = k;
						}
					}
					D[i][j] = {v : bVal+F[i][j], dir : bDir, carved : false};
				}
			}
			
			var bVal = Number.MAX_VALUE,bEle;
			for(var i = 0; i < height; i++){
				if(D[width-1][i].v < bVal){
					bVal = D[width-1][i].v;
					bEle = i;
				}
			}
			
			seam = [];
			for(var x = width-1,y = bEle; x >= 0; x--){
				seam[seam.length] = {x:x,y:y};
				D[x][y].carved = true;
				y += D[x][y].dir || 0;
			}
		}
		
		ctx.runDPY = function(){//Y方向seam
			D = [];
			
			var width = this.width,height = this.height;
			
			//初始化第一行
			for(var i = 0; i < width; i++){
				D[i] = [];
				D[i][0] = {v:F[i][0], dir:undefined, carved:false};
			}
			
			for(var j = 1; j < height; j++){
				for(var i = 0; i < width; i++){
					var bVal = Number.MAX_VALUE,bDir;
					for(var k = -1; k <= 1; k ++){
						if(i+k>=0 && i+k < width && D[i+k][j-1].v<bVal){
							bVal = D[i+k][j-1].v;
							bDir = k;
						}
					}
					D[i][j] = {v:bVal+F[i][j], dir:bDir, carved:false};
					//console.log("x:"+i+",y:"+j+",dir:"+bDir);
				}
			}
			
			var bVal = Number.MAX_VALUE,bEle;
			for(var i = 0; i < width; i++){
				if(D[i][height-1].v < bVal){
					bVal = D[i][height-1].v;
					bEle = i;
				}
			}
			
			seam = [];
			for(var y = height-1,x = bEle; y >= 0; y--){
				seam[seam.length] = {x:x,y:y};
				D[x][y].carved = true;
				x += D[x][y].dir || 0;
			}
		}
		
		ctx.normalize = function(para){
			var width = this.width, height = this.height;
			var newWidth = width - (para == "width"),
				newHeight = height - (para == "height");
			var newImageData = this.createImageData(newWidth, newHeight);
			
			if(para == "width"){
				/* p:新ImageData指针,i:原ImageData指针
				   (x,y):原坐标,(nx,ny):新坐标
				*/
				
				for(var p = 0,i = 0,len = this.image.data.length,x = 0,y = 0,nx = 0,ny = 0;
					i < len;
					i+=4,x++)
				{
					if(x == width){
						x = 0;
						y ++ ;
					}
					if(!D[x][y].carved){
						for(var k = 0; k < 4; k++){
							newImageData.data[p+k] = this.image.data[i+k];
						}
						p += 4;
						//console.log("nx:"+nx+",ny:"+ny+",x:"+x+",y:"+y);
						F[nx][ny] = F[x][y];
						if(++nx == newWidth){
							nx = 0;
							ny ++ ;
						}
					}
				}
				F.length --;
			}
			else{
				var colCarved = [];
				for(var i = 0; i < width; i++){//(i,j)原坐标
					for(var j = 0; j < height; j++){
						if(D[i][j].carved){
							colCarved[i] = true;
						}
						else{
							var pos = (j*width+i)*4,nPos = (i+(j-!!colCarved[i])*newWidth)*4;
							for(var k = 0; k < 4; k++){
								newImageData.data[nPos+k] = this.image.data[pos+k];
							}
							F[i][j - !!colCarved[i]] = F[i][j];
						}
					}
					F[i].length --;
				}
			}
			this.image = newImageData;
		}
		
		ctx.carve = function(para){
			if(para == 'Y'){
				this.runDPY();
				this.normalize("width");
				this.reDraw();
			}
			else if(para == 'X'){
				this.runDPX();
				this.normalize("height");
				this.reDraw();
			}
		}
		
		ctx.beginRetarget = function(){
		
			if(this.reseted){
				this.calcEnergy();
				this.reseted = false;
			}
			
			while(this.width != this.tarWidth || this.height != this.tarHeight){
			
				if(this.width > this.tarWidth){
					this.runDPY();
					this.normalize("width");
					this.width --;
				}
				/*else if(this.width < frameWidth){
					//TODO	
				}*/
				
				if(this.height > this.tarHeight){
					this.runDPX();
					this.normalize("height");
					this.height --;
				}
				/*else if(this.height < frameHeight){
					//TODO
				}*/
				
				if(this.flagPause){
					this.flagPause = false;
					break;
				}
			}
			this.reDraw();
		}
		
		$("width").onchange = function(){
			ctx.setTarWidth(this.value);
		}
		$("height").onchange = function(){
			ctx.setTarHeight(this.value);
		}
		$("btnPause").onclick = function(){
			flagPause = true;
		}
		$("btnReset").onclick = function(){
			ctx.resetImage();
		}
		$("btnRun").onclick = function(){
			ctx.beginRetarget();
		}
		$("btnCarveStep").onclick = function(){
			
		}
		$("btnCarveX").onclick = function(){
			if(ctx.reseted){
				ctx.calcEnergy();
				ctx.reseted = false;
			}
			ctx.carve("X");
		}
		$("btnCarveY").onclick = function(){
			if(ctx.reseted){
				ctx.calcEnergy();
				ctx.reseted = false;
			}
			ctx.carve("Y");
		}
		$("btnDownload").onclick = function(){
			var tCanvas = document.createElement("canvas"), tCtx = tCanvas.getContext("2d");
			tCanvas.width = ctx.width;
			tCanvas.height = ctx.height;
			tCtx.putImageData(ctx.image,0,0);
			var url = tCanvas.toDataURL("png");
			//url = url.replace(/png/,"octet-stream");
			//console.log(url);
			window.open(url);
		}
		$("btnComp").onclick = function(){
			var cmpFrame = $("cmpFrame");
			var cmpCanvas = $("cmpCanvas"), cmpCtx = cmpCanvas.getContext("2d");
			var img = new Image();
			img.src = ctx.src;
			
			cmpFrame.style.width = frame.style.width;
			cmpFrame.style.height = frame.style.height;
			cmpFrame.style.display = "block";
			cmpCanvas.width = canvas.width;
			cmpCanvas.height = canvas.height;
			
			img.onload = function(){
				//cmpCtx.scale(ctx.width/ctx.orgImageData.width, ctx.height/ctx.orgImageData.height);
				cmpCtx.drawImage(img,0,0,ctx.width,ctx.height);
			}
		}
}

function main(){
	init();
	ctx.loadImage("QQ图片20141213152800.jpg");
}

window.onload=main;