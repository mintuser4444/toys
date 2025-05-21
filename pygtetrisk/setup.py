from distutils.core import setup
import py2exe
import glob

setup(name='tetris', description='another networked tetris', version='0.4', windows= [{'script':'tetris'}], options={'py2exe':{'packages':'encodings', 'includes':'cairo, pango, pangocairo, atk, gobject'}}, data_files = [('glade', glob.glob('glade/*.*'))])

