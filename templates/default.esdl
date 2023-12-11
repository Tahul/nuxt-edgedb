module default {
  type BlogPost {
    property content: str {
      default := 'My super blog post.';
    };
    property description: str {
      default := 'My blog post description.';
    };
    property title: str {
      default := 'My blog super blog post title.';
    };
  }
}
