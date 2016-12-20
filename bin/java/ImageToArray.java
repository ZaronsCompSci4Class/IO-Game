import java.io.IOException;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import javax.imageio.ImageIO;
import java.applet.Applet;
/**
 * Write a description of class ImageToArray here.
 * 
 * @author (your name) 
 * @version (a version number or a date)
 */
public class ImageToArray
{
    public static void main (String[] args) {
        BufferedImage img = null;
        try {
            img = ImageIO.read(new File("../rawMap.png"));
            int height = img.getHeight();
            int width = img.getWidth();
            int stringIndex = 0;
            StringBuilder strB = new StringBuilder();
            String pixels = "";
            Color pixColor;
            for(int i = 0; i < height; i++){
                stringIndex = width * i;
                for(int j = 0; j < width; j++){
                    pixColor = new Color(img.getRGB(j,i));
                    if(pixColor.getRGB() == -16777216){
                        //sets black areas to uncollidable
                        strB.append(1);
                        img.setRGB(j,i,-16777216);
                    }else if(pixColor.getRGB() == -16711936){
                        //sets green areas to special overlapping
                        strB.append(2);
                        img.setRGB(j,i,-16711936);
                    }else{
                        //sets white areas to nothing
                        strB.append(0);
                        img.setRGB(j,i,-1);
                    }
                }
            }
            try (PrintStream out = new PrintStream(new FileOutputStream("../collisionMap.txt"))){
                out.print(strB.toString());
                out.flush();
                out.close();
            } catch (IOException e) {
                System.out.println("Write failed");
            }
        } catch (IOException e) {
        }
    }
    
    /*public void paint(Graphics g) {
        g.drawImage(read(),0,0,null);
    }*/
}
