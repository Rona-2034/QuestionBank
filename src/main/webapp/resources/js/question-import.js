$(function(){
	question_import.initial();
});

var question_import={
		uploading : false,
		initial : function initial() {
			this.prepareFileUpload();
			this.questionDataProcess();
		},
		prepareFileUpload : function prepareFileUpload(){
			$("#question-file").change(function(){
				var file = this.files && this.files.length > 0 ? this.files[0] : null;
				$("#div-file-list").empty();
				if(file == null){
					return;
				}
				if(file.size > 20 * 1024 * 1024){
					util.notify("只能上传20M以下的文件。");
					$(this).val("");
					return;
				}
				var fileName = file.name.toLowerCase();
				if(!(/\.(xls|xlsx)$/i).test(file.name)){
					util.error("请上传xls或xlsx文件。");
					$(this).val("");
					return;
				}
				var formData = new FormData();
				formData.append("file", file);
				question_import.uploading = true;
				$("#div-file-list").html("<span>正在上传：" + file.name + "</span>");
				$.ajax({
					type : "POST",
					url : document.getElementsByTagName('base')[0].href + "admin/upload-uploadify/",
					data : formData,
					processData : false,
					contentType : false,
					success : function(data) {
						question_import.uploading = false;
						if(data == "系统错误"){
							util.error("文件上传失败");
							$("#div-file-list").empty();
							$("#question-file").val("");
							return;
						}
						$('#div-file-list').html('<a class=\'file-name\'>' 
								+ file.name 
								+ '</a><input type=\'hidden\' value=\'' 
								+ file.name + '\' />');
					},
					error : function() {
						question_import.uploading = false;
						util.error("文件上传失败");
						$("#div-file-list").empty();
						$("#question-file").val("");
					}
				});
			});
		},
		questionDataProcess : function questionDataProcess(){
			$("#from-question-import").submit(function(){
				var filePath = $("#div-file-list").find("input").val();
				if(question_import.uploading){
					util.notify("文件正在上传，请稍后提交。");
					return false;
				}
				if(filePath == null || filePath == ""){
					util.error("请先选择并上传文件。");
					return false;
				}
				$.ajax({
					headers : {
						'Accept' : 'application/json',
						'Content-Type' : 'application/json'
					},
					type : "POST",
					url : $("#from-question-import").attr("action") + "/" + $(".upload-question-group select").val(),
					data : filePath,
					success : function(message, tst, jqXHR) {
						if (!util.checkSessionOut(jqXHR))
							return false;
						if (message.result == "success") {
							util.success("导入成功", function() {
								$("#submit-div .form-message").text(message.messageInfo);
								//document.location.href = document.getElementsByTagName('base')[0].href + 'admin/course-list';
							});
						} else {
							util.error("操作失败请稍后尝试:" + message.result);
							$("#submit-div .form-message").text(message.messageInfo);
							$("#btn-add-submit").removeAttr("disabled");
						}
					},
					error : function(jqXHR, textStatus) {
						util.error("操作失败请稍后尝试");
						$("#btn-add-submit").removeAttr("disabled");
					}
				});
				return false;
			});
		}
};
