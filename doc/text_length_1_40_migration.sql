alter table et_user
  modify username varchar(40) not null comment '账号',
  modify truename varchar(40) default null comment '真实姓名',
  modify phone varchar(40) default null;
