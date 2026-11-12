create table if not exists widget_daily (
  day     date    not null,
  host    text    not null,
  event   text    not null,
  hits    integer not null default 0,
  uniques integer not null default 0,
  primary key (day, host, event)
);

create table if not exists widget_visitors (
  day     date not null,
  host    text not null,
  event   text not null,
  visitor text not null,
  primary key (day, host, event, visitor)
);
