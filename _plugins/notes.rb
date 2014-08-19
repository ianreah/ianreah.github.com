module Jekyll
  class NotesTag < Liquid::Tag
    def render(context)
      "<span style='font-family:Bradley Hand ITC'>"
    end
  end
  
  class EndNotesTag < Liquid::Tag
    def render(context)
      "</span>"
    end
  end
end

Liquid::Template.register_tag('notes', Jekyll::NotesTag)
Liquid::Template.register_tag('endnotes', Jekyll::EndNotesTag)