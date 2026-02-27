import { describe, it, expect } from 'vitest'
import { getFileCategory, getFileExtension } from '../../components/clipboard/FileIcon'
import type { FileCategory } from '../../components/clipboard/FileIcon'

describe('FileIcon', () => {
  describe('getFileCategory', () => {
    describe('document files', () => {
      it('should detect doc as document', () => {
        expect(getFileCategory('test.doc')).toBe('document')
      })

      it('should detect docx as document', () => {
        expect(getFileCategory('document.docx')).toBe('document')
      })

      it('should detect txt as document', () => {
        expect(getFileCategory('readme.txt')).toBe('document')
      })

      it('should detect rtf as document', () => {
        expect(getFileCategory('file.rtf')).toBe('document')
      })

      it('should detect odt as document', () => {
        expect(getFileCategory('doc.odt')).toBe('document')
      })
    })

    describe('image files', () => {
      it('should detect jpg/jpeg as image', () => {
        expect(getFileCategory('photo.jpg')).toBe('image')
        expect(getFileCategory('photo.jpeg')).toBe('image')
      })

      it('should detect png as image', () => {
        expect(getFileCategory('image.png')).toBe('image')
      })

      it('should detect gif as image', () => {
        expect(getFileCategory('animation.gif')).toBe('image')
      })

      it('should detect webp as image', () => {
        expect(getFileCategory('image.webp')).toBe('image')
      })

      it('should detect svg as image', () => {
        expect(getFileCategory('icon.svg')).toBe('image')
      })

      it('should detect bmp as image', () => {
        expect(getFileCategory('bitmap.bmp')).toBe('image')
      })
    })

    describe('video files', () => {
      it('should detect mp4 as video', () => {
        expect(getFileCategory('video.mp4')).toBe('video')
      })

      it('should detect avi as video', () => {
        expect(getFileCategory('movie.avi')).toBe('video')
      })

      it('should detect mkv as video', () => {
        expect(getFileCategory('video.mkv')).toBe('video')
      })

      it('should detect mov as video', () => {
        expect(getFileCategory('clip.mov')).toBe('video')
      })

      it('should detect webm as video', () => {
        expect(getFileCategory('video.webm')).toBe('video')
      })
    })

    describe('audio files', () => {
      it('should detect mp3 as audio', () => {
        expect(getFileCategory('song.mp3')).toBe('audio')
      })

      it('should detect wav as audio', () => {
        expect(getFileCategory('audio.wav')).toBe('audio')
      })

      it('should detect flac as audio', () => {
        expect(getFileCategory('music.flac')).toBe('audio')
      })

      it('should detect aac as audio', () => {
        expect(getFileCategory('audio.aac')).toBe('audio')
      })

      it('should detect ogg as audio', () => {
        expect(getFileCategory('sound.ogg')).toBe('audio')
      })
    })

    describe('archive files', () => {
      it('should detect zip as archive', () => {
        expect(getFileCategory('archive.zip')).toBe('archive')
      })

      it('should detect rar as archive', () => {
        expect(getFileCategory('files.rar')).toBe('archive')
      })

      it('should detect 7z as archive', () => {
        expect(getFileCategory('backup.7z')).toBe('archive')
      })

      it('should detect tar as archive', () => {
        expect(getFileCategory('package.tar')).toBe('archive')
      })

      it('should detect gz as archive', () => {
        expect(getFileCategory('file.gz')).toBe('archive')
      })

      it('should detect bz2 as archive', () => {
        expect(getFileCategory('compressed.bz2')).toBe('archive')
      })
    })

    describe('code files', () => {
      it('should detect js as code', () => {
        expect(getFileCategory('script.js')).toBe('code')
      })

      it('should detect ts as code', () => {
        expect(getFileCategory('app.ts')).toBe('code')
      })

      it('should detect tsx as code', () => {
        expect(getFileCategory('component.tsx')).toBe('code')
      })

      it('should detect py as code', () => {
        expect(getFileCategory('main.py')).toBe('code')
      })

      it('should detect java as code', () => {
        expect(getFileCategory('Main.java')).toBe('code')
      })

      it('should detect c/cpp as code', () => {
        expect(getFileCategory('main.c')).toBe('code')
        expect(getFileCategory('app.cpp')).toBe('code')
      })

      it('should detect html/css as code', () => {
        expect(getFileCategory('index.html')).toBe('code')
        expect(getFileCategory('style.css')).toBe('code')
      })

      it('should detect json/xml as code', () => {
        expect(getFileCategory('config.json')).toBe('code')
        expect(getFileCategory('data.xml')).toBe('code')
      })

      it('should detect yaml as code', () => {
        expect(getFileCategory('config.yaml')).toBe('code')
        expect(getFileCategory('config.yml')).toBe('code')
      })

      it('should detect sh as code', () => {
        expect(getFileCategory('script.sh')).toBe('code')
      })

      it('should detect md as code', () => {
        expect(getFileCategory('README.md')).toBe('code')
      })
    })

    describe('spreadsheet files', () => {
      it('should detect xls as spreadsheet', () => {
        expect(getFileCategory('data.xls')).toBe('spreadsheet')
      })

      it('should detect xlsx as spreadsheet', () => {
        expect(getFileCategory('report.xlsx')).toBe('spreadsheet')
      })

      it('should detect csv as spreadsheet', () => {
        expect(getFileCategory('data.csv')).toBe('spreadsheet')
      })

      it('should detect ods as spreadsheet', () => {
        expect(getFileCategory('sheet.ods')).toBe('spreadsheet')
      })
    })

    describe('presentation files', () => {
      it('should detect ppt as presentation', () => {
        expect(getFileCategory('slides.ppt')).toBe('presentation')
      })

      it('should detect pptx as presentation', () => {
        expect(getFileCategory('presentation.pptx')).toBe('presentation')
      })

      it('should detect odp as presentation', () => {
        expect(getFileCategory('slides.odp')).toBe('presentation')
      })
    })

    describe('pdf files', () => {
      it('should detect pdf', () => {
        expect(getFileCategory('document.pdf')).toBe('pdf')
      })
    })

    describe('unknown files', () => {
      it('should return other for unknown extensions', () => {
        expect(getFileCategory('file.unknown')).toBe('other')
        expect(getFileCategory('file.xyz')).toBe('other')
        expect(getFileCategory('file')).toBe('other')
      })

      it('should handle files without extension', () => {
        expect(getFileCategory('README')).toBe('other')
        expect(getFileCategory('Makefile')).toBe('other')
      })
    })

    describe('case sensitivity', () => {
      it('should handle uppercase extensions', () => {
        expect(getFileCategory('photo.JPG')).toBe('image')
        expect(getFileCategory('script.JS')).toBe('code')
        expect(getFileCategory('document.PDF')).toBe('pdf')
      })

      it('should handle mixed case extensions', () => {
        expect(getFileCategory('photo.JpG')).toBe('image')
        expect(getFileCategory('script.Ts')).toBe('code')
      })
    })

    describe('path handling', () => {
      it('should handle full paths', () => {
        expect(getFileCategory('/path/to/file.ts')).toBe('code')
        expect(getFileCategory('C:\\Users\\Documents\\file.py')).toBe('code')
      })

      it('should handle relative paths', () => {
        expect(getFileCategory('./src/components/File.tsx')).toBe('code')
        expect(getFileCategory('../config.yaml')).toBe('code')
      })

      it('should handle multiple dots in filename', () => {
        expect(getFileCategory('file.test.spec.ts')).toBe('code')
        expect(getFileCategory('archive.2024.01.01.zip')).toBe('archive')
      })
    })
  })

  describe('getFileExtension', () => {
    it('should extract extension correctly', () => {
      expect(getFileExtension('test.txt')).toBe('txt')
      expect(getFileExtension('app.ts')).toBe('ts')
      expect(getFileExtension('image.png')).toBe('png')
    })

    it('should handle uppercase extensions', () => {
      expect(getFileExtension('photo.JPG')).toBe('jpg')
      expect(getFileExtension('script.TS')).toBe('ts')
    })

    it('should handle files without extension', () => {
      // When there's no extension, split('.').pop() returns the whole string
      expect(getFileExtension('README')).toBe('readme')
      expect(getFileExtension('Makefile')).toBe('makefile')
    })

    it('should handle multiple dots', () => {
      expect(getFileExtension('file.test.spec.ts')).toBe('ts')
      expect(getFileExtension('archive.tar.gz')).toBe('gz')
    })

    it('should handle paths', () => {
      expect(getFileExtension('/path/to/file.ts')).toBe('ts')
      expect(getFileExtension('./src/components/File.tsx')).toBe('tsx')
    })

    it('should return lowercase', () => {
      expect(getFileExtension('PHOTO.PNG')).toBe('png')
      expect(getFileExtension('Script.JavaScript')).toBe('javascript')
    })
  })
})
