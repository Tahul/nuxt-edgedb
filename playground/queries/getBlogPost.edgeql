select BlogPost {
  title,
  description
}
filter .id = <uuid>$blogpost_id;
